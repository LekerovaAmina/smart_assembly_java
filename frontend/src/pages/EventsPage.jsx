import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRegisteredEvents } from '../context/AuthContext';
import { getEvents, getHrEvents } from '../api';
import EventCard from '../components/EventCard';
import Badge from '../components/Badge';

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-card border border-border p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-6 w-24 bg-gray-100 rounded-badge" />
      <div className="h-5 w-3/4 bg-gray-100 rounded" />
      <div className="space-y-1.5">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="h-4 w-28 bg-gray-100 rounded" />
      </div>
      <div className="h-9 bg-gray-100 rounded-btn mt-auto" />
    </div>
  );
}

const STATUS_LABEL = {
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
};

const STATUS_COLOR = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}${timeStr ? ` · ${timeStr.substring(0, 5)}` : ''}`;
  } catch { return dateStr; }
}

function HistoryCard({ event }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="bg-surface rounded-card border border-border p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge type={event.eventType} />
        <span className={`text-xs font-medium px-2.5 py-1 rounded-badge flex-shrink-0 ${
          STATUS_COLOR[event.status] ?? 'bg-gray-100 text-gray-500'
        }`}>
          {STATUS_LABEL[event.status] ?? event.status}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2">
        {event.eventName}
      </h3>
      <div className="space-y-1 text-xs text-text-muted">
        <p>📅 {formatDate(event.eventDate, event.startTime)}</p>
        {event.location && <p>📍 {event.location}</p>}
        <p>👥 {event.currentParticipants ?? 0} участников</p>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { isHr, user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Для волонтёра: all | my | history
  // Для HR: published | drafts | history
  const [activeTab, setActiveTab] = useState(isHr ? 'published' : 'all');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isHr ? await getHrEvents() : await getEvents();
      const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      setEvents(data);
    } catch (err) {
      setError('Не удалось загрузить список мероприятий.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isHr]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // localStorage привязан к userId — нет смешения между аккаунтами
  const userId = user?.userId;
  const localRegistered = getRegisteredEvents(userId);

  const filteredEvents = events.filter((event) => {
    if (isHr) {
      if (activeTab === 'drafts')  return event.status === 'DRAFT';
      if (activeTab === 'history') return event.status === 'COMPLETED' || event.status === 'CANCELLED';
      return event.status === 'OPEN' || event.status === 'IN_PROGRESS';
    } else {
      if (activeTab === 'my') {
        return event.isRegistered === true || localRegistered.includes(event.id);
      }
      if (activeTab === 'history') {
        return event.status === 'COMPLETED' || event.status === 'CANCELLED';
      }
      // 'all' — только активные для волонтёра
      return event.status === 'OPEN' || event.status === 'IN_PROGRESS';
    }
  });

  // Сортируем историю по дате — сначала новые
  const displayEvents = activeTab === 'history'
    ? [...filteredEvents].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
    : filteredEvents;

  const myEventsCount = events.filter(
    e => e.isRegistered || localRegistered.includes(e.id)
  ).length;

  const historyCount = events.filter(
    e => e.status === 'COMPLETED' || e.status === 'CANCELLED'
  ).length;

  return (
    <div className="relative min-h-screen">
      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:opacity-70">×</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {isHr ? 'Управление мероприятиями' : 'Мероприятия'}
        </h1>
        {isHr && (
          <button
            onClick={() => navigate('/events/new')}
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors cursor-pointer shadow-sm"
          >
            + Создать мероприятие
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex gap-4 mb-6 border-b border-border pb-px">
        {isHr ? (
          <>
            <button
              onClick={() => setActiveTab('published')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'published' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Активные ({events.filter(e => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'drafts' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Черновики ({events.filter(e => e.status === 'DRAFT').length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'history' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              История ({historyCount})
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'all' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Все мероприятия
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'my' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Мои отклики ({myEventsCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'history' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              История ({historyCount})
            </button>
          </>
        )}
      </div>

      {/* Сетка */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : displayEvents.length > 0
          ? displayEvents.map((event) =>
              activeTab === 'history'
                ? <HistoryCard key={event.id} event={event} />
                : <EventCard key={event.id} event={event} onUpdate={fetchEvents} />
            )
          : (
            <div className="col-span-3 text-center py-16 text-text-muted">
              <p className="text-lg mb-1">Пусто</p>
              <p className="text-sm">
                {isHr
                  ? activeTab === 'drafts'  ? 'Нет черновиков'
                  : activeTab === 'history' ? 'Нет завершённых мероприятий'
                  : 'Нет активных мероприятий'
                  : activeTab === 'my'      ? 'Вы ещё не откликались ни на одно мероприятие'
                  : activeTab === 'history' ? 'Нет завершённых мероприятий'
                  : 'Ближайших мероприятий пока нет'}
              </p>
            </div>
          )
        }
      </div>
    </div>
  );
}