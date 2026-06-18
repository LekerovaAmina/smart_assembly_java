import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getEventById, registerEvent, unregisterEvent, publishEvent,
  deleteEvent, completeEvent, getEventQr, getAttendees,
  updateAttendeeHours, checkinUser,
} from '../api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import QrScannerModal from '../components/QrScannerModal';

const STATUS_LABEL = {
  DRAFT: 'Черновик', OPEN: 'Открыта запись', IN_PROGRESS: 'Идёт сейчас',
  COMPLETED: 'Завершено', CANCELLED: 'Отменено', CLOSED: 'Запись закрыта',
};

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}${timeStr ? ` · ${timeStr.substring(0, 5)}` : ''}`;
  } catch { return dateStr; }
}

function formatTime(iso) {
  if (!iso) return '—';
  return iso.replace('T', ' ').substring(0, 16);
}

const UserCircle = ({ size = 40 }) => (
  <div className="rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted flex-shrink-0"
    style={{ width: size, height: size }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

// ── Компонент строки участника ────────────────────────────────────────────────
function AttendeeRow({ attendee, eventId, onSaved }) {
  const [leaveTime, setLeaveTime] = useState(
    attendee.earlyLeaveTime ? attendee.earlyLeaveTime.substring(11, 16) : ''
  );
  const [extra, setExtra] = useState(attendee.extraHours ?? 0);
  const [note, setNote] = useState(attendee.hoursNote ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [checkinLoading, setCheckinLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateAttendeeHours(eventId, attendee.userId, {
        earlyLeaveTime: leaveTime || '',
        extraHours: parseFloat(extra) || 0,
        hoursNote: note,
      });
      setMsg('✅ Сохранено');
      if (onSaved) onSaved();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Ошибка'));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      await checkinUser(eventId, attendee.userId);
      setMsg('✅ Чекин проставлен');
      if (onSaved) onSaved();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || 'Ошибка чекина'));
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <UserCircle size={36} />
          <div>
            <p className="text-sm font-semibold text-text-primary">{attendee.name}</p>
            <p className="text-xs text-text-muted">{attendee.phone} · {attendee.uniqueId || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-badge font-medium ${
            attendee.status === 'ATTENDED' ? 'bg-green-100 text-green-700' :
            attendee.status === 'REGISTERED' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'}`}>
            {attendee.status === 'ATTENDED' ? 'Пришёл' :
             attendee.status === 'REGISTERED' ? 'Записан' :
             attendee.status === 'CONFIRMED' ? 'Подтверждён' : attendee.status}
          </span>
          {attendee.checkInTime
            ? <span className="text-xs text-green-600">🕐 {formatTime(attendee.checkInTime)}</span>
            : <button onClick={handleCheckin} disabled={checkinLoading}
                className="text-xs px-2 py-1 bg-orange-50 text-primary border border-orange-200 rounded hover:bg-orange-100 transition-colors cursor-pointer">
                {checkinLoading ? '...' : '+ Чекин'}
              </button>
          }
          {attendee.calculatedHours != null &&
            <span className="text-xs font-semibold text-primary">{attendee.calculatedHours}ч</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">Время ухода</label>
          <input type="time" value={leaveTime} onChange={e => setLeaveTime(e.target.value)}
            className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Доп. часы</label>
          <input type="number" step="0.25" value={extra} onChange={e => setExtra(e.target.value)}
            className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Примечание</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Комментарий..."
            className="w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {msg ? <span className="text-xs text-text-muted">{msg}</span> : <span />}
        <button onClick={handleSave} disabled={saving}
          className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50">
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

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
      // Верим серверу как главному источнику истины
      setRegistered(res.data?.isRegistered ?? false);
      // Очищаем localStorage если уже зарегистрирован на сервере
      if (res.data?.isRegistered) {
        const local = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
        if (local.includes(Number(id))) {
          localStorage.setItem('my_registered_events', JSON.stringify(local.filter(x => x !== Number(id))));
        }
      }
    } catch {
      setError('Не удалось загрузить мероприятие');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const fetchAttendees = useCallback(async () => {
    setAttendeesLoading(true);
    try {
      const res = await getAttendees(id);
      setAttendees(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isHr && showAttendees) fetchAttendees();
  }, [isHr, showAttendees, fetchAttendees]);

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      const local = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
      const num = Number(id);
      if (registered) {
        await unregisterEvent(id);
        setRegistered(false);
        localStorage.setItem('my_registered_events', JSON.stringify(local.filter(x => x !== num)));
        setEvent(prev => prev ? { ...prev, currentParticipants: Math.max(0, (prev.currentParticipants ?? 0) - 1) } : null);
      } else {
        await registerEvent(id);
        setRegistered(true);
        if (!local.includes(num)) localStorage.setItem('my_registered_events', JSON.stringify([...local, num]));
        setEvent(prev => prev ? { ...prev, currentParticipants: (prev.currentParticipants ?? 0) + 1 } : null);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Опубликовать это мероприятие?')) return;
    setActionLoading(true);
    try {
      await publishEvent(id);
      await fetchEvent();
    } catch (e) {
      alert(`Ошибка публикации: ${e.response?.data?.message || 'Проверьте все обязательные поля'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить черновик безвозвратно?')) return;
    setActionLoading(true);
    try {
      await deleteEvent(id);
      navigate('/events');
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Завершить мероприятие и начислить часы всем участникам? Это действие необратимо.')) return;
    setActionLoading(true);
    setCompleteMsg(null);
    try {
      const res = await completeEvent(id);
      setCompleteMsg(`✅ ${res.data?.message || 'Завершено'} (обработано: ${res.data?.attendeesProcessed ?? '—'})`);
      await fetchEvent();
      if (showAttendees) await fetchAttendees();
    } catch (e) {
      setCompleteMsg('❌ ' + (e.response?.data?.message || 'Ошибка завершения'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="h-5 w-96 bg-gray-100 rounded" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm">{error}</div>
  );

  if (!event) return null;

  let speakersList = [];
  if (event.speakers) {
    if (typeof event.speakers === 'string') {
      speakersList = event.speakers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(event.speakers)) {
      speakersList = event.speakers.filter(Boolean);
    }
  }

  const isActive = ['OPEN', 'CLOSED', 'IN_PROGRESS'].includes(event.status);
  const isCompleted = event.status === 'COMPLETED';

  return (
    <div>
      {showQr && <QrModal eventId={id} onClose={() => setShowQr(false)} />}

      {/* Заголовок */}
      <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate('/events')}
            className="text-xs text-text-muted hover:text-primary mb-2 inline-flex items-center gap-1 transition-colors cursor-pointer">
            ← Назад к списку
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{event.eventName || 'Мероприятие'}</h1>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              event.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
              event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              'bg-blue-50 text-blue-600'}`}>
              {STATUS_LABEL[event.status] || event.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary flex-wrap">
            <span>{formatDate(event.eventDate, event.startTime)}</span>
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
              📱 Отметить приход (сканирование)
            </button>
          )}


          {!isHr && event.status !== 'DRAFT' && (
            <button onClick={handleRegister} disabled={actionLoading}
              className={`px-5 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                registered ? 'bg-gray-200 text-text-secondary hover:bg-gray-300' : 'bg-primary text-white hover:bg-primary-hover'}`}>
              {registered ? 'Отменить участие' : 'Откликнуться'}
            </button>
          )}
        </div>
      </div>

      {/* Сообщение о завершении */}
      {completeMsg && (
        <div className={`mb-4 px-4 py-3 rounded-card text-sm border ${
          completeMsg.startsWith('✅')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'}`}>
          {completeMsg}
        </div>
      )}

      {/* Основной контент */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2 space-y-4">
          {/* Описание */}
          <div className="bg-surface rounded-card border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Описание</h2>
              <Badge type={event.eventType} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {event.description || <span className="text-text-muted italic">Описание не указано</span>}
            </p>
            {speakersList.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border">
                <h2 className="text-base font-semibold text-text-primary mb-3">Спикеры</h2>
                <div className="space-y-3">
                  {speakersList.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <UserCircle size={36} />
                      <span className="text-sm font-medium text-text-primary">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Блок участников для HR */}
          {isHr && (
            <div className="bg-surface rounded-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-text-primary">
                  Участники
                  {attendees.length > 0 && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-badge">
                      {attendees.length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => {
                    const next = !showAttendees;
                    setShowAttendees(next);
                  }}
                  className="text-sm text-primary hover:text-primary-hover font-medium transition-colors cursor-pointer">
                  {showAttendees ? 'Скрыть' : 'Показать список'}
                </button>
              </div>

              {showAttendees && (
                attendeesLoading
                  ? <div className="text-sm text-text-muted py-4 text-center">Загружаем...</div>
                  : attendees.length === 0
                  ? <div className="text-sm text-text-muted text-center py-6">Никто ещё не записался</div>
                  : <div className="space-y-3">
                      {attendees.map(a => (
                        <AttendeeRow
                          key={a.userId}
                          attendee={a}
                          eventId={id}
                          onSaved={() => {
                            fetchAttendees();
                          }}
                        />
                      ))}
                    </div>
              )}
            </div>
          )}
        </div>

        {/* Сайдбар */}
        <div className="space-y-4">
          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Требования</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {event.currentParticipants ?? 0} / {event.maxParticipants || '∞'} участников
              </div>
              {event.dressCode && (
                <div className="text-xs text-text-secondary">👔 {event.dressCode}</div>
              )}
            </div>
          </div>

          {event.coordinatorName && (
            <div className="bg-surface rounded-card border border-border p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Координатор</h3>
              <p className="text-sm text-text-secondary">{event.coordinatorName}</p>
            </div>
          )}

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-card p-4">
              <p className="text-sm font-semibold text-green-700 mb-1">✅ Мероприятие завершено</p>
              <p className="text-xs text-green-600">Часы начислены всем участникам</p>
            </div>
          )}
        </div>
      </div>
    </div>
      {/* QR Scanner Modal для волонтеров */}
      {showQrScanner && (
        <QrScannerModal
          eventId={id}
          onSuccess={(result) => {
            alert(result.message);
            // Опционально: обновляем данные события для синхронизации
            fetchEvent();
          }}
          onClose={() => setShowQrScanner(false)}
        />
      )}
  );
}