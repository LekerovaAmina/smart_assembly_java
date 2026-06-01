import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // По умолчанию для HR открываем 'published', для волонтера 'all'
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Умная фильтрация в зависимости от роли (HR или Волонтер)
  const filteredEvents = events.filter((event) => {
    if (isHr) {
      if (activeTab === 'drafts') return event.status === 'DRAFT';
      return event.status === 'OPEN'; // Вкладка 'published'
    } else {
      if (activeTab === 'my') {
        const localRegistered = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
        return event.isRegistered === true || localRegistered.includes(event.id);
      }
      return true; // Вкладка 'all'
    }
  });

  // Считаем отклики волонтера
  const getMyEventsCount = () => {
    const localRegistered = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
    return events.filter(e => e.isRegistered || localRegistered.includes(e.id)).length;
  };

  return (
    <div className="relative min-h-screen">
      {/* Уведомление об ошибке в правом верхнем углу (не ломает верстку) */}
      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:opacity-70">×</button>
        </div>
      )}

      {/* Заголовок страницы */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          {isHr ? 'Управление мероприятиями' : 'Ближайшие мероприятия'}
        </h1>
        {isHr && (
          <button
            onClick={() => navigate('/events/new')} // ИСПОЛЬЗУЕМ /events/new ВМЕСТО /create ЧТОБЫ БЭКЕНД НЕ ПАДАЛ
            className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-btn transition-colors cursor-pointer shadow-sm"
          >
            + Создать мероприятие
          </button>
        )}
      </div>

      {/* ДИНАМИЧЕСКИЕ ВКЛАДКИ (Разные для HR и Волонтера) */}
      <div className="flex gap-4 mb-6 border-b border-border pb-px">
        {isHr ? (
          <>
            <button
              onClick={() => setActiveTab('published')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'published' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Опубликованные ({events.filter(e => e.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'drafts' ? 'border-primary text-primary font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Черновики ({events.filter(e => e.status === 'DRAFT').length})
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
              Мои отклики ({getMyEventsCount()})
            </button>
          </>
        )}
      </div>

      {/* Сетка карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filteredEvents.length > 0
          ? filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onUpdate={fetchEvents}
              />
            ))
          : (
              <div className="col-span-3 text-center py-16 text-[#999999]">
                <p className="text-lg mb-1">Пусто</p>
                <p className="text-sm">
                  {isHr
                    ? (activeTab === 'drafts' ? 'Нет сохраненных черновиков' : 'Нет опубликованных событий')
                    : (activeTab === 'my' ? 'Вы еще не откликнулись ни на одно событие' : 'Ближайших событий пока нет')
                  }
                </p>
              </div>
            )
        }
      </div>
    </div>
  );
}