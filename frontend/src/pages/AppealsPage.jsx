import { useState, useEffect, useCallback } from 'react';
import { getMyStrikes } from '../api';

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

const STATUS_ICONS = {
  PENDING: '⏳',
  APPROVED: '✅',
  REJECTED: '❌',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch { return '—'; }
}

function AppealCard({ strike }) {
  const appeal = strike.appealStatus;
  if (!appeal) return null;

  return (
    <div className="bg-white rounded-card border border-border p-5">
      {/* Шапка статус */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{STATUS_ICONS[appeal] ?? '📋'}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-badge ${
            STATUS_COLORS[appeal] ?? 'bg-gray-100 text-gray-600'
          }`}>
            {STATUS_LABELS[appeal] ?? appeal}
          </span>
        </div>
        <span className="text-xs text-text-muted">{formatDate(strike.issuedAt)}</span>
      </div>

      {/* Страйк */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-xs text-text-muted mb-1">Страйк:</p>
        <p className="text-sm text-text-primary">{strike.reason}</p>
        {strike.eventName && (
          <p className="text-xs text-text-muted mt-1">📅 {strike.eventName}</p>
        )}
      </div>

      {/* Результат рассмотрения */}
      {appeal === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          ✅ Апелляция одобрена — страйк аннулирован
        </div>
      )}

      {appeal === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          ❌ Апелляция отклонена — страйк остаётся в силе
        </div>
      )}

      {appeal === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          ⏳ Ожидает рассмотрения HR
        </div>
      )}
    </div>
  );
}

export default function AppealsPage() {
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyStrikes();
      const all = Array.isArray(res.data) ? res.data : [];
      // Только те страйки, по которым есть апелляция
      setStrikes(all.filter(s => s.appealStatus || s.isAppealed));
    } catch {
      setError('Не удалось загрузить апелляции');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = strikes.filter(s => s.appealStatus === 'PENDING');
  const decided = strikes.filter(s => s.appealStatus !== 'PENDING');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Мои апелляции</h1>
        <p className="text-sm text-text-muted mt-1">
          Чтобы подать апелляцию — перейдите в раздел{' '}
          <a href="/strikes" className="text-primary hover:underline">Страйки</a>
        </p>
      </div>

      {/* Счётчики */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {strikes.filter(s => s.appealStatus === 'PENDING').length}
          </p>
          <p className="text-xs text-text-muted mt-1">На рассмотрении</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {strikes.filter(s => s.appealStatus === 'APPROVED').length}
          </p>
          <p className="text-xs text-text-muted mt-1">Одобрено</p>
        </div>
        <div className="bg-white rounded-card border border-border p-4 text-center">
          <p className="text-3xl font-bold text-red-500">
            {strikes.filter(s => s.appealStatus === 'REJECTED').length}
          </p>
          <p className="text-xs text-text-muted mt-1">Отклонено</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-36 bg-gray-100 rounded-card" />)}
        </div>
      ) : strikes.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-base font-semibold text-text-primary">Апелляций нет</p>
          <p className="text-sm text-text-muted mt-1">
            Если у вас есть активный страйк, вы можете подать апелляцию в разделе{' '}
            <a href="/strikes" className="text-primary hover:underline">Страйки</a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* На рассмотрении */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-3">
                На рассмотрении
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-badge">
                  {pending.length}
                </span>
              </h2>
              <div className="space-y-3">
                {pending.map(s => <AppealCard key={s.id} strike={s} />)}
              </div>
            </div>
          )}

          {/* Рассмотренные */}
          {decided.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 mt-6">
                Рассмотренные
              </h2>
              <div className="space-y-3">
                {decided.map(s => <AppealCard key={s.id} strike={s} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}