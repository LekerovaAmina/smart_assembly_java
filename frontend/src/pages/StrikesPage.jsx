import { useState, useEffect, useCallback } from 'react';
import { getMyStrikes, createAppeal } from '../api';

const SEVERITY_LABELS = { WARNING: 'Предупреждение', STRIKE: 'Страйк' };
const APPEAL_STATUS_LABELS = { PENDING: 'На рассмотрении', APPROVED: 'Одобрена', REJECTED: 'Отклонена' };
const APPEAL_STATUS_COLORS = {
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

function AppealModal({ strike, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (reason.trim().length < 20) {
      setError('Минимум 20 символов');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAppeal(strike.id, { reason: reason.trim() });
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Ошибка при подаче апелляции');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-card border border-border p-6 w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text-primary mb-1">Подать апелляцию</h3>
        <p className="text-xs text-text-muted mb-4">
          Страйк от {formatDate(strike.issuedAt)} — {strike.reason}
        </p>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Обоснование <span className="text-text-muted">(минимум 20 символов)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={5}
          placeholder="Опишите подробно, почему страйк выдан несправедливо..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none mb-1"
        />
        <div className="text-xs text-text-muted text-right mb-3">{reason.length} симв.</div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || reason.trim().length < 20}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Подать апелляцию'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StrikeCard({ strike, onAppeal }) {
  const isActive = strike.isActive;
  const hasAppeal = strike.isAppealed || strike.appealStatus;

  return (
    <div className={`rounded-card border p-5 transition-colors ${
      isActive ? 'border-red-200 bg-red-50' : 'border-border bg-gray-50'
    }`}>
      {/* Шапка */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-badge ${
            strike.severity === 'STRIKE'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {SEVERITY_LABELS[strike.severity] ?? strike.severity}
          </span>

          {!isActive && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2.5 py-1 rounded-badge">
              Снят
            </span>
          )}

          {strike.appealStatus && (
            <span className={`text-xs px-2.5 py-1 rounded-badge font-medium ${
              APPEAL_STATUS_COLORS[strike.appealStatus] ?? 'bg-gray-100 text-gray-600'
            }`}>
              Апелляция: {APPEAL_STATUS_LABELS[strike.appealStatus] ?? strike.appealStatus}
            </span>
          )}
        </div>

        <span className="text-xs text-text-muted flex-shrink-0">{formatDate(strike.issuedAt)}</span>
      </div>

      {/* Причина */}
      <p className="text-sm text-text-primary mb-2">{strike.reason}</p>

      {/* Мероприятие */}
      {strike.eventName && (
        <p className="text-xs text-text-muted mb-2">
          📅 За мероприятие: <span className="font-medium">{strike.eventName}</span>
        </p>
      )}

      {/* Кто выдал */}
      {strike.issuedByName && (
        <p className="text-xs text-text-muted">Выдал: {strike.issuedByName}</p>
      )}

      {/* Кнопка апелляции */}
      {isActive && !hasAppeal && (
        <button
          onClick={() => onAppeal(strike)}
          className="mt-4 text-sm font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          Подать апелляцию →
        </button>
      )}
    </div>
  );
}

export default function StrikesPage() {
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appealTarget, setAppealTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStrikes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyStrikes();
      setStrikes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Не удалось загрузить страйки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStrikes(); }, [fetchStrikes]);

  const activeStrikes = strikes.filter(s => s.isActive);
  const inactiveStrikes = strikes.filter(s => !s.isActive);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-card shadow-xl text-sm font-medium border flex items-center gap-2 ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
          {toast.msg}
        </div>
      )}

      {appealTarget && (
        <AppealModal
          strike={appealTarget}
          onClose={() => setAppealTarget(null)}
          onSubmitted={() => {
            showToast('Апелляция подана. HR рассмотрит её в ближайшее время.');
            fetchStrikes();
          }}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Мои страйки</h1>
        <p className="text-sm text-text-muted mt-1">
          История предупреждений и страйков
        </p>
      </div>

      {/* Счётчики */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{activeStrikes.length}</p>
          <p className="text-xs text-text-muted mt-1">Активных</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-gray-400">{inactiveStrikes.length}</p>
          <p className="text-xs text-text-muted mt-1">Снятых</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-text-primary">{strikes.length}</p>
          <p className="text-xs text-text-muted mt-1">Всего</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-card" />
          ))}
        </div>
      ) : strikes.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-card p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-base font-semibold text-green-700">Страйков нет</p>
          <p className="text-sm text-green-600 mt-1">Так держать!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Активные */}
          {activeStrikes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                Активные
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-badge">
                  {activeStrikes.length}
                </span>
              </h2>
              <div className="space-y-3">
                {activeStrikes.map(s => (
                  <StrikeCard key={s.id} strike={s} onAppeal={setAppealTarget} />
                ))}
              </div>
            </div>
          )}

          {/* Снятые */}
          {inactiveStrikes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 mt-6">
                История (снятые / аннулированные)
              </h2>
              <div className="space-y-3">
                {inactiveStrikes.map(s => (
                  <StrikeCard key={s.id} strike={s} onAppeal={setAppealTarget} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}