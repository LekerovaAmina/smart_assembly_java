import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, registerEvent, unregisterEvent, publishEvent, deleteEvent } from '../api';
import Badge from '../components/Badge';

const STATUS_LABEL = {
  DRAFT: 'Черновик',
  OPEN: 'Открыта запись',
  IN_PROGRESS: 'Идёт сейчас',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  CLOSED: 'Запись закрыта',
};

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const timeFormatted = timeStr ? ` · ${timeStr.substring(0, 5)}` : '';
    return `${day}.${month}.${year}${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

const UserCircle = ({ size = 40 }) => (
  <div
    className="rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted flex-shrink-0"
    style={{ width: size, height: size }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShirtIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEventById(id);
        setEvent(res.data);

        const localRegistered = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
        const isReg = (res.data?.isRegistered ?? false) || localRegistered.includes(Number(id));
        setRegistered(isReg);
      } catch (err) {
        setError('Не удалось загрузить мероприятие');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      const localRegistered = JSON.parse(localStorage.getItem('my_registered_events') || '[]');
      const eventIdNum = Number(id);

      if (registered) {
        await unregisterEvent(id);
        setRegistered(false);
        const updated = localRegistered.filter(item => item !== eventIdNum);
        localStorage.setItem('my_registered_events', JSON.stringify(updated));
        setEvent(prev => prev ? { ...prev, currentParticipants: Math.max(0, (prev.currentParticipants ?? 0) - 1) } : null);
      } else {
        await registerEvent(id);
        setRegistered(true);
        if (!localRegistered.includes(eventIdNum)) {
          localRegistered.push(eventIdNum);
          localStorage.setItem('my_registered_events', JSON.stringify(localRegistered));
        }
        setEvent(prev => prev ? { ...prev, currentParticipants: (prev.currentParticipants ?? 0) + 1 } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Вы уверены, что хотите опубликовать это мероприятие?')) return;
    setActionLoading(true);
    try {
      await publishEvent(id);
      alert('Мероприятие успешно опубликовано!');
      navigate('/events');
    } catch (err) {
      console.error(err);
      alert(`Ошибка при публикации: ${err.response?.data?.message || 'Проверьте заполнение всех полей черновика (Координатор, Количество участников и т.д.)'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы точно хотите безвозвратно удалить этот черновик?')) return;
    setActionLoading(true);
    try {
      await deleteEvent(id);
      alert('Черновик успешно удален!');
      navigate('/events');
    } catch (err) {
      console.error(err);
      alert('Ошибка при удалении черновика');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-5 w-96 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  if (!event) return null;

  // Безопасное приведение спикеров к массиву строк
  let speakersList = [];
  if (event.speakers) {
    if (typeof event.speakers === 'string') {
      speakersList = event.speakers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(event.speakers)) {
      speakersList = event.speakers.map(s => (typeof s === 'object' ? (s.name || s.firstName) : s)).filter(Boolean);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <button
            onClick={() => navigate('/events')}
            className="text-xs text-text-muted hover:text-primary mb-2 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Назад к списку
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {event.eventName || 'Мероприятие'}
            </h1>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${event.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
              {STATUS_LABEL[event.status] || event.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary flex-wrap">
            <span>{formatDate(event.eventDate, event.startTime)}</span>
            {event.location && (
              <>
                <span className="text-border">·</span>
                <span>{event.location}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          {event.status === 'DRAFT' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium rounded-btn transition-colors cursor-pointer"
              >
                Удалить
              </button>

              <button
                onClick={() => navigate(`/events/${id}/edit`)}
                disabled={actionLoading}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-border text-sm font-medium rounded-btn transition-colors cursor-pointer"
              >
                Редактировать
              </button>

              <button
                onClick={handlePublish}
                disabled={actionLoading}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-btn transition-colors shadow-sm cursor-pointer"
              >
                Опубликовать
              </button>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={actionLoading}
              className={`px-5 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                registered ? 'bg-gray-200 text-text-secondary hover:bg-gray-300' : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {registered ? 'Отменить участие' : 'Откликнуться'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-2">
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
                  {speakersList.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <UserCircle size={36} />
                      <span className="text-sm font-medium text-text-primary">{speaker}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Требования</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <UsersIcon />
                Кол-во людей: {event.currentParticipants ?? 0}/{event.maxParticipants || 'Не ограничено'}
              </div>
              {event.dressCode && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <ShirtIcon />
                  Дресс-код: {event.dressCode}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}