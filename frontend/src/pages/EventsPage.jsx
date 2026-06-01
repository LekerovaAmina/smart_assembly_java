import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvents, getHrEvents } from '../api';
import EventCard from '../components/EventCard';

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

export default function EventsPage() {
  const { isHr } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isHr ? await getHrEvents() : await getEvents();
      // API may return array or { content: [] } (paginated)
      const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
      setEvents(data);
    } catch (err) {
      setError('Не удалось загрузить мероприятия');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isHr]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {isHr ? 'Мои мероприятия' : 'Ближайшие мероприятия'}
        </h1>
        {isHr && (
          <button className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors">
            + Создать мероприятие
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : events.length > 0
          ? events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onUpdate={fetchEvents}
              />
            ))
          : (
              <div className="col-span-3 text-center py-16 text-text-muted">
                <p className="text-lg mb-1">Нет мероприятий</p>
                <p className="text-sm">Скоро здесь появятся ближайшие события</p>
              </div>
            )
        }
      </div>
    </div>
  );
}
