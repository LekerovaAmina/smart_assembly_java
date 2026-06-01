import { useState, useEffect, useCallback } from 'react';
import { getAllRequests, approveRegistration, rejectRegistration } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  PENDING: 'Ожидает',
  APPROVED: 'Принята',
  REJECTED: 'Отклонена',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function SkeletonRow() {
  return (
    <div className="bg-surface rounded-card border border-border p-4 animate-pulse flex gap-4">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-56 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function RejectModal({ request, onConfirm, onCancel }) {
  const [comment, setComment] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-card border border-border p-6 w-full max-w-md shadow-xl">
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Отклонить заявку
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          {request.lastName} {request.firstName} — {request.email}
        </p>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Причина отклонения (обязательно)
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Укажите причину..."
          className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirm(comment)}
            disabled={!comment.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-50"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request, onApprove, onReject, actionLoading }) {
  const isLoading = actionLoading === request.id;

  return (
    <div className="bg-surface rounded-card border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-text-muted font-semibold text-sm flex-shrink-0">
            {(request.firstName?.[0] ?? '') + (request.lastName?.[0] ?? '')}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {[request.lastName, request.firstName, request.middleName].filter(Boolean).join(' ')}
            </h3>
            <p className="text-xs text-text-muted">Заявка #{request.id}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-badge flex-shrink-0 ${STATUS_COLORS[request.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-text-secondary">
        <div><span className="text-text-muted">Email:</span> {request.email}</div>
        <div><span className="text-text-muted">Телефон:</span> {request.phone}</div>
        {request.iin && <div><span className="text-text-muted">ИИН:</span> {request.iin}</div>}
        {request.studyPlace && <div><span className="text-text-muted">Учёба:</span> {request.studyPlace}</div>}
        {request.instagram && <div><span className="text-text-muted">Instagram:</span> {request.instagram}</div>}
        {request.assemblyName && <div><span className="text-text-muted">Отделение:</span> {request.assemblyName}</div>}
      </div>

      {request.motivation && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-text-secondary border-l-2 border-primary italic">
          {request.motivation}
        </div>
      )}

      {request.status === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onApprove(request.id)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Обработка...' : '✓ Принять'}
          </button>
          <button
            onClick={() => onReject(request)}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium rounded-btn transition-colors disabled:opacity-50"
          >
            ✕ Отклонить
          </button>
        </div>
      )}
    </div>
  );
}

export default function RegistrationPage() {
  const { isHr } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllRequests({ status: activeTab, size: 50 });
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.content ?? []);
      setRequests(data);
    } catch (err) {
      setError('Не удалось загрузить заявки');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isHr) {
      navigate('/events');
      return;
    }
    fetchRequests();
  }, [fetchRequests, isHr, navigate]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await approveRegistration(id);
      showToast(`Заявка принята. ID: ${res.data?.uniqueId ?? '—'}`);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка при одобрении', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (comment) => {
    const id = rejectTarget.id;
    setRejectTarget(null);
    setActionLoading(id);
    try {
      await rejectRegistration(id, comment);
      showToast('Заявка отклонена');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка при отклонении', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    PENDING: requests.length, // будет пересчитан при смене таба
  };

  const TABS = [
    { key: 'PENDING', label: 'Ожидают рассмотрения' },
    { key: 'APPROVED', label: 'Принятые' },
    { key: 'REJECTED', label: 'Отклонённые' },
  ];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-card shadow-xl text-sm font-medium border flex items-center gap-2 max-w-sm transition-all ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
          {toast.message}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Заявки на вступление</h1>
        <button
          onClick={fetchRequests}
          className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
        >
          Обновить
        </button>
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
            {activeTab === tab.key && !loading && (
              <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Список заявок */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : requests.length > 0
          ? requests.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                actionLoading={actionLoading}
              />
            ))
          : (
            <div className="col-span-3 py-16 text-center text-text-muted">
              <p className="text-lg mb-1">Пусто</p>
              <p className="text-sm">
                {activeTab === 'PENDING' ? 'Нет новых заявок' :
                 activeTab === 'APPROVED' ? 'Нет принятых заявок' :
                 'Нет отклонённых заявок'}
              </p>
            </div>
          )
        }
      </div>
    </div>
  );
}