import { useState, useEffect } from 'react';
import { getMe, getMyHours } from '../api';

const UserIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M3 9h18" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.56 2 2 0 0 1 3.58 2.37h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  } catch { return dateStr; }
}

function StatBox({ label, value, accent = false }) {
  return (
    <div className="bg-surface rounded-card border border-border p-4 text-center flex-1">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-primary'}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userRes, hoursRes] = await Promise.all([getMe(), getMyHours()]);
        setUser(userRes.data);
        setHours(hoursRes.data);
      } catch (err) {
        setError('Не удалось загрузить профиль');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-gray-100 rounded-card" />
          <div className="col-span-2 space-y-4">
            <div className="flex gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 flex-1 bg-gray-100 rounded-card" />)}
            </div>
            <div className="h-48 bg-gray-100 rounded-card" />
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

  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Пользователь'
    : 'Пользователь';

  const totalHours = hours?.totalHours ?? user?.totalHours ?? 0;
  const monthlyHours = hours?.breakdown?.currentMonth ?? hours?.monthlyHours ?? 0;
  const strikeCount = user?.strikeCount ?? 0;

  const eventHistory = hours?.breakdown?.events ?? hours?.events ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Профиль</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — user card */}
        <div className="bg-surface rounded-card border border-border p-5 relative">
          <button className="absolute top-4 right-4 text-text-muted hover:text-primary transition-colors">
            <EditIcon />
          </button>

          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted mx-auto mb-4">
            <UserIcon />
          </div>

          {/* Name */}
          <h2 className="text-base font-semibold text-text-primary text-center">{fullName}</h2>
          <p className="text-xs text-text-muted text-center mt-1">
            ID: {user?.uniqueId || user?.id || 'User_id'}
          </p>

          {/* Status badge */}
          <div className="flex justify-center mt-3 mb-5">
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-badge">
              {user?.status === 'ACTIVE' ? 'Активист' : user?.status === 'INACTIVE' ? 'Неактивен' : user?.status ?? 'Активист'}
            </span>
          </div>

          {/* Contact info */}
          <div className="space-y-2.5 border-t border-border pt-4">
            {user?.departmentName && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <BuildingIcon />
                {user.departmentName}
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <PhoneIcon />
                {user.phone}
              </div>
            )}
            {user?.email && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <MailIcon />
                {user.email}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Stats row */}
          <div className="flex gap-4">
            <StatBox label="Всего часов" value={totalHours} />
            <StatBox label="Часы за месяц" value={monthlyHours} />
            <StatBox label="Страйки" value={strikeCount} />
          </div>

          {/* Event history */}
          <div className="bg-surface rounded-card border border-border p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">История мероприятий</h3>
              <button className="text-xs text-primary hover:text-primary-hover font-medium transition-colors">
                Смотреть все
              </button>
            </div>

            {eventHistory.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-xs text-text-muted font-medium text-left pb-2">Дата</th>
                    <th className="text-xs text-text-muted font-medium text-left pb-2">Название</th>
                    <th className="text-xs text-text-muted font-medium text-left pb-2">Роль</th>
                    <th className="text-xs text-text-muted font-medium text-right pb-2">Часы</th>
                  </tr>
                </thead>
                <tbody>
                  {eventHistory.slice(0, 6).map((ev, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2.5 text-text-secondary text-xs">{formatDate(ev.date || ev.startDate)}</td>
                      <td className="py-2.5 text-text-primary font-medium">{ev.eventName || ev.name}</td>
                      <td className="py-2.5 text-text-secondary text-xs">{ev.role || 'Волонтер'}</td>
                      <td className="py-2.5 text-text-secondary text-xs text-right">{ev.hours || ev.hoursDelta || 0}ч</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                История мероприятий пуста
              </p>
            )}
          </div>

          {/* Analytics stub */}
          <div className="bg-surface rounded-card border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Аналитика</h3>
            <p className="text-sm text-text-muted text-center py-4">В разработке</p>
          </div>
        </div>
      </div>
    </div>
  );
}
