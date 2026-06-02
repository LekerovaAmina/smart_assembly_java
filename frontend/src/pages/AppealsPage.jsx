import { useState, useEffect, useCallback } from 'react';
import { getPendingAppeals, approveAppeal, rejectAppeal } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  PENDING: 'На рассмотрении',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch { return '—'; }
}

function RejectModal({ appeal, onConfirm, onCancel }) {
  const [comment, setComment] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card border border-border p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-text-primary mb-1">Отклонить апелляцию</h3>
        <p className="text-sm text-text-muted mb-4">
          {appeal.volunteerName} — страйк от {formatDate(appeal.createdAt)}
        </p>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Причина отклонения <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Объясните почему апелляция отклонена..."
          className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Отмена
          </button>
          <button
            onClick={() => onConfirm(comment)}
            disabled={!comment.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-50 cursor-pointer"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}

function AppealCard({ appeal, onApprove, onReject, actionLoading }) {
  const isLoading = actionLoading === appeal.id;

  return (
    <div className="bg-white rounded-card border border-border p-5">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{appeal.volunteerName}</p>
          <p className="text-xs text-text-muted mt-0.5">Подана {formatDate(appeal.createdAt)}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-badge flex-shrink-0 ${STATUS_COLORS[appeal.status]}`}>
          {STATUS_LABELS[appeal.status]}
        </span>
      </div>

      {/* Страйк */}
      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
        <p className="text-xs text-red-600 font-medium mb-1">Страйк:</p>
        <p className="text-sm text-red-800">{appeal.strikeSeverity === 'WARNING' ? '⚠️ Предупреждение' : '🚫 Страйк'}</p>
        {appeal.strikeReason && (
          <p className="text-xs text-red-700 mt-1">{appeal.strikeReason}</p>
        )}
        {appeal.strikeEventName && (
          <p className="text-xs text-red-600 mt-1">📅 {appeal.strikeEventName}</p>
        )}
      </div>

      {/* Обоснование апелляции */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-text-muted font-medium mb-1">Обоснование волонтёра:</p>
        <p className="text-sm text-text-primary">{appeal.reason}</p>
      </div>

      {/* Кнопки — только для PENDING */}
      {appeal.status === 'PENDING' && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(appeal.id)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Обработка...' : '✓ Одобрить — снять страйк'}
          </button>
          <button
            onClick={() => onReject(appeal)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium rounded-btn transition-colors disabled:opacity-50 cursor-pointer"
          >
            ✕ Отклонить
          </button>
        </div>
      )}

      {/* Итог если уже рассмотрена */}
      {appeal.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          ✅ Одобрено — страйк аннулирован
          {appeal.reviewedByName && <span className="text-xs text-green-600 block mt-0.5">HR: {appeal.reviewedByName}</span>}
        </div>
      )}
      {appeal.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ❌ Отклонено
          {appeal.hrComment && <p className="text-xs mt-1">{appeal.hrComment}</p>}
          {appeal.reviewedByName && <span className="text-xs text-red-600 block mt-0.5">HR: {appeal.reviewedByName}</span>}
        </div>
      )}
    </div>
  );
}

export default function AppealsPage() {
  const { isHr } = useAuth();
  const navigate = useNavigate();

  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingAppeals();
      setAppeals(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Не удалось загрузить апелляции');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHr) { navigate('/events'); return; }
    fetchAppeals();
  }, [fetchAppeals, isHr, navigate]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveAppeal(id);
      showToast('Апелляция одобрена. Страйк снят.');
      fetchAppeals();
    } catch (e) {
      showToast(e.response?.data?.message || 'Ошибка при одобрении', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (comment) => {
    const id = rejectTarget.id;
    setRejectTarget(null);
    setActionLoading(id);
    try {
      await rejectAppeal(id, comment);
      showToast('Апелляция отклонена.');
      fetchAppeals();
    } catch (e) {
      showToast(e.response?.data?.message || 'Ошибка при отклонении', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = appeals.filter(a => a.status === activeTab);
  const pendingCount  = appeals.filter(a => a.status === 'PENDING').length;
  const approvedCount = appeals.filter(a => a.status === 'APPROVED').length;
  const rejectedCount = appeals.filter(a => a.status === 'REJECTED').length;

  const TABS = [
    { key: 'PENDING',  label: `На рассмотрении (${pendingCount})` },
    { key: 'APPROVED', label: `Одобренные (${approvedCount})` },
    { key: 'REJECTED', label: `Отклонённые (${rejectedCount})` },
  ];

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-card shadow-xl text-sm font-medium border flex items-center gap-2 max-w-sm ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
          {toast.message}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          appeal={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Апелляции</h1>
          <p className="text-sm text-text-muted mt-1">
            Волонтёры оспаривают страйки — рассмотрите каждую
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-badge">
            {pendingCount} ожидают
          </span>
        )}
      </div>

      {/* Счётчики */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-text-muted mt-1">На рассмотрении</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-xs text-text-muted mt-1">Одобрено</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-red-500">{rejectedCount}</p>
          <p className="text-xs text-text-muted mt-1">Отклонено</p>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-4 mb-6 border-b border-border pb-px">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-12 text-center">
          <p className="text-4xl mb-3">
            {activeTab === 'PENDING' ? '🎉' : activeTab === 'APPROVED' ? '✅' : '📋'}
          </p>
          <p className="text-base font-semibold text-text-primary">
            {activeTab === 'PENDING' ? 'Нет апелляций на рассмотрении'
             : activeTab === 'APPROVED' ? 'Нет одобренных апелляций'
             : 'Нет отклонённых апелляций'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(appeal => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}