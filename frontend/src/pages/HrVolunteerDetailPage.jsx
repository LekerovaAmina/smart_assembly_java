import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById_hr, getVolunteerStrikes, createStrike, revokeStrike } from '../api';

const SEVERITY_LABELS = { WARNING: 'Предупреждение', STRIKE: 'Страйк' };

function StrikeCard({ strike, onRevoke }) {
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!window.confirm('Снять страйк?')) return;
    setLoading(true);
    try {
      await revokeStrike(strike.id);
      onRevoke();
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`border rounded-card p-4 ${strike.isActive ? 'border-red-200 bg-red-50' : 'border-border bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-badge ${
              strike.severity === 'STRIKE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {SEVERITY_LABELS[strike.severity] ?? strike.severity}
            </span>
            {!strike.isActive && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-badge">Снят</span>
            )}
            {strike.appealStatus === 'APPROVED' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-badge">Апелляция одобрена</span>
            )}
          </div>
          <p className="text-sm text-text-primary">{strike.reason}</p>
          {strike.eventName && (
            <p className="text-xs text-text-muted mt-1">📅 {strike.eventName}</p>
          )}
          <p className="text-xs text-text-muted mt-1">
            {strike.issuedAt ? new Date(strike.issuedAt).toLocaleDateString('ru-RU') : '—'}
            {strike.issuedByName ? ` · выдал ${strike.issuedByName}` : ''}
          </p>
        </div>
        {strike.isActive && (
          <button onClick={handleRevoke} disabled={loading}
            className="text-xs px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50">
            {loading ? '...' : 'Снять'}
          </button>
        )}
      </div>
    </div>
  );
}

function CreateStrikeForm({ volunteerId, onCreated }) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('STRIKE');
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Укажите причину'); return; }
    setLoading(true);
    setError(null);
    try {
      await createStrike(volunteerId, {
        reason: reason.trim(),
        severity,
        eventId: eventId ? Number(eventId) : undefined,
      });
      setReason('');
      setEventId('');
      setSeverity('STRIKE');
      setShow(false);
      onCreated();
    } catch (e) {
      setError(e.response?.data?.message || 'Ошибка выдачи страйка');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return (
    <button onClick={() => setShow(true)}
      className="w-full py-2.5 border-2 border-dashed border-red-200 text-red-600 text-sm font-medium rounded-card hover:bg-red-50 transition-colors cursor-pointer">
      + Выдать страйк / предупреждение
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="border border-red-200 bg-red-50 rounded-card p-4 space-y-3">
      <h4 className="text-sm font-semibold text-red-700">Новый страйк</h4>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div>
        <label className="block text-xs text-text-muted mb-1">Тип</label>
        <select value={severity} onChange={e => setSeverity(e.target.value)}
          className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white">
          <option value="WARNING">Предупреждение</option>
          <option value="STRIKE">Страйк</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-text-muted mb-1">Причина *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder="Опишите причину..."
          className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white resize-none" />
      </div>
      <div>
        <label className="block text-xs text-text-muted mb-1">ID мероприятия (если за пропуск)</label>
        <input type="number" value={eventId} onChange={e => setEventId(e.target.value)}
          placeholder="Оставьте пустым, если не связано"
          className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-btn transition-colors cursor-pointer disabled:opacity-50">
          {loading ? 'Выдаём...' : 'Выдать'}
        </button>
        <button type="button" onClick={() => { setShow(false); setError(null); }}
          className="px-4 py-2 bg-white border border-border text-gray-600 text-sm font-medium rounded-btn hover:bg-gray-50 transition-colors cursor-pointer">
          Отмена
        </button>
      </div>
    </form>
  );
}

export default function HrVolunteerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [strikesLoading, setStrikesLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await getUserById_hr(id);
      setUser(res.data);
    } catch {
      setError('Не удалось загрузить профиль волонтёра');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStrikes = useCallback(async () => {
    setStrikesLoading(true);
    try {
      const res = await getVolunteerStrikes(id);
      setStrikes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStrikes([]);
    } finally {
      setStrikesLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); fetchStrikes(); }, [fetchUser, fetchStrikes]);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-48 bg-gray-100 rounded-card" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm">{error}</div>
  );

  if (!user) return null;

  const activeStrikes = strikes.filter(s => s.isActive);

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/hr/volunteers')}
        className="text-xs text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 transition-colors cursor-pointer">
        ← К списку волонтёров
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Карточка волонтёра */}
        <div className="bg-surface rounded-card border border-border p-5">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-text-primary text-center">
            {user.lastName} {user.firstName}
          </h2>
          <p className="text-xs text-text-muted text-center mt-1">{user.uniqueId || '—'}</p>

          <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted text-xs">Телефон</span>
              <span className="text-text-primary text-xs">{user.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-xs">Роль</span>
              <span className="text-text-primary text-xs">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted text-xs">Статус</span>
              <span className="text-text-primary text-xs">{user.status}</span>
            </div>
          </div>

          {/* Метрики */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{user.totalHours ?? 0}</p>
              <p className="text-xs text-text-muted">часов</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${activeStrikes.length > 0 ? 'text-red-600' : 'text-text-muted'}`}>
                {activeStrikes.length}
              </p>
              <p className="text-xs text-text-muted">страйков</p>
            </div>
          </div>
        </div>

        {/* Страйки */}
        <div className="col-span-2 space-y-4">
          <div className="bg-surface rounded-card border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Страйки
              {activeStrikes.length > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-badge">
                  {activeStrikes.length} активных
                </span>
              )}
            </h3>

            <div className="space-y-3 mb-4">
              <CreateStrikeForm volunteerId={id} onCreated={fetchStrikes} />
            </div>

            {strikesLoading ? (
              <div className="text-sm text-text-muted text-center py-4">Загружаем...</div>
            ) : strikes.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-6">
                Страйков нет 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {strikes.map(s => (
                  <StrikeCard key={s.id} strike={s} onRevoke={fetchStrikes} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}