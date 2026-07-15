import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { registerEvent, unregisterEvent, publishEvent } from '../api';
import { useAuth, getRegisteredEvents, setRegisteredEvents } from '../context/AuthContext';

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 flex-shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 flex-shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

function formatEventDateTime(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const timeFormatted = timeStr ? ` · ${timeStr.substring(0, 5)}` : '';
    return `${day}.${month}.${year}${timeFormatted}`;
  } catch { return dateStr; }
}

export default function EventCard({ event, onUpdate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.userId;

  // Проверяем регистрацию: сервер говорит isRegistered ИЛИ есть в localStorage ЭТОГО пользователя
  const [registered, setRegistered] = useState(() => {
    if (!event?.id) return false;
    const local = getRegisteredEvents(userId);
    return (event.isRegistered ?? false) || local.includes(event.id);
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleRegister = async (e) => {
    e.stopPropagation();
    if (!event?.id) return;

    setLoading(true);
    try {
      const local = getRegisteredEvents(userId);
      const eventIdNum = Number(event.id);

      if (registered) {
        await unregisterEvent(event.id);
        setRegistered(false);
        setRegisteredEvents(userId, local.filter(id => id !== eventIdNum));
        showNotification('Вы отменили участие');
      } else {
        await registerEvent(event.id);
        setRegistered(true);
        if (!local.includes(eventIdNum)) {
          setRegisteredEvents(userId, [...local, eventIdNum]);
        }
        showNotification('Вы успешно записались!');
      }

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Ошибка при изменении статуса участия';
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDirectly = async (e) => {
    e.stopPropagation();
    if (!event?.id) return;
    if (!window.confirm(`Опубликовать мероприятие "${event.eventName}"?`)) return;

    setLoading(true);
    try {
      await publishEvent(event.id);
      showNotification('Мероприятие опубликовано!');
      if (onUpdate) setTimeout(() => onUpdate(), 1000);
    } catch (err) {
      showNotification('Не удалось опубликовать', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  const isFull = (event.maxParticipants ?? 0) > 0
    && (event.currentParticipants ?? 0) >= event.maxParticipants;

  return (
    <>
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 pointer-events-none animate-fade-in">
          <div className={`px-5 py-3 rounded-card shadow-xl text-sm font-medium border flex items-center gap-2 max-w-sm pointer-events-auto ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
            : toast.type === 'warning' ? 'bg-orange-50 border-orange-200 text-primary'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-current" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div
        className="bg-surface rounded-card border border-border p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow duration-150 relative"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {registered && event.status !== 'DRAFT' && (
          <span className="absolute top-4 right-4 bg-[#FFF0E6] text-primary text-[11px] font-bold px-2 py-0.5 rounded-badge">
            Вы участвуете
          </span>
        )}

        {event.status === 'DRAFT' && (
          <span className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-badge">
            Черновик
          </span>
        )}

        <div><Badge type={event.eventType} /></div>

        <div>
          <h3 className="text-base font-semibold text-text-primary leading-snug line-clamp-2 pr-16">
            {event.eventName || 'Без названия'}
          </h3>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-secondary flex items-center">
            <CalendarIcon />
            {formatEventDateTime(event.eventDate, event.startTime)}
          </span>
          {event.location && (
            <span className="text-sm text-text-secondary flex items-center">
              <PinIcon />{event.location}
            </span>
          )}
        </div>

        {event.status === 'DRAFT' ? (
          <button
            onClick={handlePublishDirectly}
            disabled={loading}
            className="w-full bg-green-600 text-white hover:bg-green-700 py-2 rounded-btn text-sm font-medium transition-all mt-auto cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        ) : !registered && isFull ? (
          <p className="w-full py-2 rounded-btn text-xs text-center font-medium text-text-muted bg-gray-100 mt-auto">
            Набор закрыт. Мероприятия будут организовываться чаще, не пропускайте уведомлений
          </p>
        ) : (
          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full py-2 rounded-btn text-sm font-medium transition-all mt-auto cursor-pointer ${
              registered
                ? 'bg-gray-200 text-text-secondary hover:bg-gray-300'
                : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
            }`}
          >
            {loading ? 'Секунду...' : registered ? 'Отменить участие' : 'Откликнуться'}
          </button>
        )}
      </div>
    </>
  );
}