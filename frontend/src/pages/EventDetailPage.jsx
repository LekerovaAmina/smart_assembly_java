import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, registerEvent, unregisterEvent } from '../api';
import Badge from '../components/Badge';

const STATUS_LABEL = {
  DRAFT: 'Черновик',
  OPEN: 'Открыта запись',
  IN_PROGRESS: 'Идёт сейчас',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  CLOSED: 'Запись закрыта',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hh}:${mm}`;
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

const EmailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.56 2 2 0 0 1 3.58 2.37h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
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

const QrIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="14" y1="14" x2="14" y2="14" />
    <line x1="17" y1="14" x2="17" y2="14" />
    <line x1="20" y1="14" x2="20" y2="14" />
    <line x1="14" y1="17" x2="14" y2="17" />
    <line x1="17" y1="17" x2="20" y2="17" />
    <line x1="20" y1="20" x2="20" y2="20" />
  </svg>
);

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-text-primary mb-2">{title}</h2>
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEventById(id);
        setEvent(res.data);
        setRegistered(res.data?.isRegistered ?? false);
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
    setRegLoading(true);
    try {
      if (registered) {
        await unregisterEvent(id);
        setRegistered(false);
      } else {
        await registerEvent(id);
        setRegistered(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-5 w-96 bg-gray-100 rounded" />
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-card" />)}
          </div>
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-card" />)}
          </div>
        </div>
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

  const coordinator = event.coordinator || event.organizer;
  const speakers = event.speakers || event.guests || [];

  return (
    <div>
      {/* Top header */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-text-muted hover:text-primary mb-2 inline-flex items-center gap-1 transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {event.title || event.name || 'Мероприятие'}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary flex-wrap">
            <span>{formatDate(event.startDate || event.date)}</span>
            {event.endDate && event.endDate !== event.startDate && (
              <>
                <span>—</span>
                <span>{formatDate(event.endDate)}</span>
              </>
            )}
            {event.location && (
              <>
                <span className="text-border">·</span>
                <span>г. {event.location}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleRegister}
          disabled={regLoading}
          className={`px-5 py-2 rounded-btn text-sm font-medium transition-colors flex-shrink-0 ${
            registered
              ? 'bg-gray-200 text-text-secondary hover:bg-gray-300'
              : 'bg-primary text-white hover:bg-primary-hover'
          } disabled:opacity-60`}
        >
          {regLoading ? '...' : registered ? 'Отменить участие' : 'Откликнуться'}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        {/* Left — 2/3 */}
        <div className="col-span-2 space-y-0">
          <div className="bg-surface rounded-card border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Описание</h2>
              <Badge type={event.type} />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {event.description || <span className="text-text-muted italic">Описание не указано</span>}
            </p>

            {event.goals && (
              <div className="mt-5 pt-5 border-t border-border">
                <h2 className="text-base font-semibold text-text-primary mb-2">Цели</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{event.goals}</p>
              </div>
            )}

            {event.tasks && (
              <div className="mt-5 pt-5 border-t border-border">
                <h2 className="text-base font-semibold text-text-primary mb-2">Задачи</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{event.tasks}</p>
              </div>
            )}

            {speakers.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border">
                <h2 className="text-base font-semibold text-text-primary mb-3">Спикеры / Гости</h2>
                <div className="space-y-3">
                  {speakers.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <UserCircle size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">
                            {speaker.name || speaker.firstName}
                          </span>
                          <span className="text-xs text-text-muted bg-gray-50 px-2 py-0.5 rounded-badge">
                            {speaker.role || (speaker.isSpeaker ? 'Спикер' : 'Гость')}
                          </span>
                        </div>
                        {speaker.position && (
                          <p className="text-xs text-text-muted">{speaker.position}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-4">
          {/* Coordinator */}
          {coordinator && (
            <div className="bg-surface rounded-card border border-border p-4">
              <div className="flex items-start gap-3 mb-3">
                <UserCircle size={44} />
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {coordinator.name || [coordinator.firstName, coordinator.lastName].filter(Boolean).join(' ') || 'Координатор'}
                  </p>
                  <p className="text-xs text-text-muted">Координатор события</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {coordinator.email && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <EmailIcon />
                    {coordinator.email}
                  </div>
                )}
                {coordinator.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <PhoneIcon />
                    {coordinator.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Требования</h3>
            <div className="space-y-2">
              {event.maxParticipants != null && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <UsersIcon />
                  Кол-во людей: {event.registeredCount ?? '?'}/{event.maxParticipants}
                </div>
              )}
              {event.dressCode && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <ShirtIcon />
                  Дресс-код: {event.dressCode}
                </div>
              )}
              {event.reserveCount != null && (
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <UsersIcon />
                  Резерв: {event.reserveUsed ?? 0}/{event.reserveCount}
                </div>
              )}
            </div>
          </div>

          {/* QR if registered */}
          {registered && (
            <button className="w-full bg-surface border border-border rounded-card px-4 py-3 flex items-center justify-between text-sm text-text-secondary hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <QrIcon />
                <span className="font-medium">QR-отметка</span>
              </div>
              <span className="text-text-muted">›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
