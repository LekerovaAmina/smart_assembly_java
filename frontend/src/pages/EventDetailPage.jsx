import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QrScannerModal from '../components/QrScannerModal';
import {
  getEventById,
  checkinUser,
  getEventQr,
  getEventAttendees,
  completeEvent,
  updateAttendee,
} from '../api';

const STATUS_LABEL = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Открыто',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
};

const ATTENDANCE_STATUS_LABEL = {
  REGISTERED: 'Записан',
  CHECKED_IN: 'Пришел',
  ABSENT: 'Не пришел',
  EARLY_LEFT: 'Ушел раньше',
};

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QrModal({ eventId, onClose }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEventQr(eventId)
      .then(res => setQr(res.data.qrBase64))
      .catch(() => setError('Не удалось загрузить QR-код'))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-card p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">QR-код мероприятия</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none cursor-pointer">×</button>
        </div>
        {loading && <div className="text-center text-text-muted py-8 text-sm">Загружаем...</div>}
        {error && <div className="text-center text-red-600 py-4 text-sm">{error}</div>}
        {qr && <img src={qr} alt="QR код" className="w-full rounded" />}
        <p className="text-xs text-text-muted text-center mt-3">
          Покажи этот QR волонтёрам для отметки о прибытии
        </p>
      </div>
    </div>
  );
}

// ── Attendees List ────────────────────────────────────────────────────────────
function AttendeesList({ eventId, attendees, onUpdated }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState('');
  const [msg, setMsg] = useState('');

  const handleEdit = (att) => {
    setEditing(att);
    setHours(att.volunteerHours?.toString() || '0');
    setMsg('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateAttendee(eventId, editing.userId, {
        status: editing.status,
        volunteerHours: parseFloat(hours) || 0,
      });
      setMsg('✅ Сохранено');
      setTimeout(() => {
        setEditing(null);
        onUpdated?.();
      }, 800);
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {attendees.map(att => (
          <div key={att.userId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
            <div>
              <p className="font-medium text-text-primary">{att.firstName} {att.lastName}</p>
              <p className="text-xs text-text-muted">{att.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-primary">{ATTENDANCE_STATUS_LABEL[att.status] || att.status}</p>
              <p className="text-xs text-text-muted">{att.volunteerHours || 0}ч</p>
              {att.checkInTime && <p className="text-xs text-green-600">{new Date(att.checkInTime).toLocaleTimeString('ru')}</p>}
            </div>
            <button onClick={() => handleEdit(att)} className="ml-2 text-blue-600 hover:text-blue-700 text-xs font-medium">
              ✏️
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded">
      <div>
        <label className="text-xs text-text-muted mb-1 block">Статус</label>
        <select
          value={editing.status}
          onChange={e => setEditing({ ...editing, status: e.target.value })}
          className="w-full px-2 py-1.5 border border-border rounded text-sm"
        >
          {Object.entries(ATTENDANCE_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-text-muted mb-1 block">Часы</label>
        <input
          type="number"
          value={hours}
          onChange={e => setHours(e.target.value)}
          className="w-full px-2 py-1.5 border border-border rounded text-sm"
          step="0.5"
          min="0"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50">
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
        <button onClick={() => setEditing(null)} className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-btn hover:bg-gray-300 transition-colors cursor-pointer">
          Отмена
        </button>
      </div>
      {msg && <span className="text-xs text-text-muted">{msg}</span>}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isHr } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // HR-специфичные состояния
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [completeMsg, setCompleteMsg] = useState(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEventById(id);
      setEvent(res.data);
      setRegistered(res.data?.isRegistered ?? false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAttendees = useCallback(async () => {
    if (!isHr) return;
    setAttendeesLoading(true);
    try {
      const res = await getEventAttendees(id);
      setAttendees(res.data || []);
    } catch (err) {
      console.error('Ошибка загрузки участников:', err);
    } finally {
      setAttendeesLoading(false);
    }
  }, [id, isHr]);

  useEffect(() => {
    fetchEvent();
    if (isHr) {
      fetchAttendees();
      const interval = setInterval(fetchAttendees, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchEvent, fetchAttendees, isHr]);

  const handleDelete = async () => {
    if (!window.confirm('Удалить мероприятие? Это необратимо!')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/v1/events/${id}`, { method: 'DELETE' });
      alert('✅ Мероприятие удалено');
      navigate('/events');
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/events/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Ошибка публикации');
      await fetchEvent();
      alert('✅ Мероприятие опубликовано!');
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeEvent(id);
      setCompleteMsg('✅ Мероприятие завершено и часы начислены!');
      setTimeout(() => fetchEvent(), 1500);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-muted">Загружаем...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">❌ {error}</div>;
  if (!event) return <div className="flex items-center justify-center min-h-screen text-text-muted">Мероприятие не найдено</div>;

  const isActive = event.status === 'IN_PROGRESS' || event.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-bg p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок и кнопки */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 break-words">{event.eventName}</h1>
            <p className="text-sm text-text-secondary line-clamp-3">{event.eventDescription}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              event.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
              event.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' :
              event.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
              event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              'bg-blue-50 text-blue-600'}`}>
              {STATUS_LABEL[event.status] || event.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary flex-wrap flex-shrink-0">
            <span>{event.eventDate && new Date(event.eventDate).toLocaleDateString('ru')} {event.startTime}</span>
            {event.location && <><span className="text-border">·</span><span>{event.location}</span></>}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {isHr && (
            <button onClick={() => setShowQr(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-btn transition-colors cursor-pointer">
              QR-код
            </button>
          )}

          {event.status === 'DRAFT' && (
            <>
              <button onClick={handleDelete} disabled={actionLoading}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium rounded-btn transition-colors cursor-pointer">
                Удалить
              </button>
              <button onClick={() => navigate(`/events/${id}/edit`)} disabled={actionLoading}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-border text-sm font-medium rounded-btn transition-colors cursor-pointer">
                Редактировать
              </button>
              <button onClick={handlePublish} disabled={actionLoading}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-btn transition-colors shadow-sm cursor-pointer">
                Опубликовать
              </button>
            </>
          )}

          {isHr && isActive && (
            <button onClick={handleComplete} disabled={actionLoading}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors shadow-sm cursor-pointer disabled:opacity-50">
              {actionLoading ? 'Завершаем...' : '🏁 Завершить и начислить часы'}
            </button>
          )}

          {!isHr && registered && event.status === 'IN_PROGRESS' && (
            <button
              onClick={() => setShowQrScanner(true)}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-btn transition-colors shadow-sm cursor-pointer"
            >
              📱 Отметить приход QR
            </button>
          )}
        </div>

        {completeMsg && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-card text-green-700 text-sm">
            {completeMsg}
          </div>
        )}

        {/* Таблица участников для HR */}
        {isHr && (
          <div className="bg-surface rounded-card p-4 sm:p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Участники</h2>
              <button
                onClick={() => { setShowAttendees(!showAttendees); if (!showAttendees) fetchAttendees(); }}
                className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary-hover transition-colors cursor-pointer"
              >
                {showAttendees ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {showAttendees && (
              attendeesLoading ? (
                <div className="text-center text-text-muted py-4 text-sm">Загружаем...</div>
              ) : attendees.length > 0 ? (
                <AttendeesList eventId={id} attendees={attendees} onUpdated={fetchAttendees} />
              ) : (
                <div className="text-center text-text-muted py-4 text-sm">Нет участников</div>
              )
            )}
          </div>
        )}

        {/* Информация о мероприятии */}
        <div className="bg-surface rounded-card p-4 sm:p-6 border border-border space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Описание</h3>
            <p className="text-sm text-text-primary">{event.eventDescription || 'Нет описания'}</p>
          </div>
          {event.location && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Место</h3>
              <p className="text-sm text-text-primary">{event.location}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Дата</h3>
              <p className="text-sm text-text-primary">{event.eventDate && new Date(event.eventDate).toLocaleDateString('ru', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">Время</h3>
              <p className="text-sm text-text-primary">{event.startTime} - {event.endTime || 'TBD'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal для волонтеров */}
      {showQrScanner && (
        <QrScannerModal
          eventId={id}
          onSuccess={(result) => {
            alert(result.message);
            fetchEvent();
          }}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* QR Modal для HR */}
      {showQr && (
        <QrModal eventId={id} onClose={() => setShowQr(false)} />
      )}
    </div>
  );
}