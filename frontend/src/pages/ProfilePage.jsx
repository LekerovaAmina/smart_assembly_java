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
    <path d="M9 3v18" /><path d="M3 9h18" />
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

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch { return dateStr; }
}

function StatBox({ label, value, accent = false, sub }) {
  return (
    <div className="bg-surface rounded-card border border-border p-4 text-center flex-1 flex flex-col justify-center gap-1">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-primary'}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

const TYPE_COLORS = {
  EVENT: 'bg-blue-50 text-blue-600',
  ADJUSTMENT: 'bg-green-50 text-green-600',
};

const TYPE_LABELS = {
  EVENT: 'Мероприятие',
  ADJUSTMENT: 'Корректировка',
};

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
              {[1, 2, 3].map(i => <div key={i} className="h-24 flex-1 bg-gray-100 rounded-card" />)}
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

  // Правильный маппинг из VolunteerHoursResponse { totalHours, breakdown: HourBreakdownItemDto[] }
  const totalHours = hours?.totalHours ?? 0;

  // Считаем часы за текущий месяц из breakdown
  const now = new Date();
  const currentMonthHours = (hours?.breakdown ?? [])
    .filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0)
    .toFixed(1);

  const strikeCount = user?.strikeCount ?? 0;

  // История: берём breakdown напрямую (это уже готовый список событий и корректировок)
  const eventHistory = hours?.breakdown ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Профиль</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — user card */}
        <div className="bg-surface rounded-card border border-border p-5 relative">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted mx-auto mb-4">
            <UserIcon />
          </div>

          <h2 className="text-base font-semibold text-text-primary text-center">{fullName}</h2>
          <p className="text-xs text-text-muted text-center mt-1">
            ID: {user?.uniqueId || '—'}
          </p>

          <div className="flex justify-center mt-3 mb-5">
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-badge">
              {user?.role === 'HR' ? 'HR-менеджер'
                : user?.role === 'SUPER_ADMIN' ? 'Администратор'
                : 'Волонтёр'}
            </span>
          </div>

          <div className="space-y-2.5 border-t border-border pt-4">
            {user?.phone && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <PhoneIcon />{user.phone}
              </div>
            )}
            {user?.email && (
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <MailIcon />{user.email}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Stats row */}
          <div className="flex gap-4">
            <StatBox label="Всего часов" value={parseFloat(totalHours).toFixed(1)} />
            <StatBox label="Часы за месяц" value={currentMonthHours} sub="текущий месяц" />
            <StatBox label="Активных страйков" value={strikeCount} />
          </div>

          {/* Event history */}
          <div className="bg-surface rounded-card border border-border p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">История активности</h3>
              <span className="text-xs text-text-muted">{eventHistory.length} записей</span>
            </div>

            {eventHistory.length > 0 ? (
              <div className="space-y-2">
                {eventHistory.slice(0, 8).map((item, i) => {
                  const hours = parseFloat(item.hours);
                  const isPositive = hours >= 0;
                  const typeColor = TYPE_COLORS[item.type] || 'bg-gray-50 text-gray-600';
                  const typeLabel = TYPE_LABELS[item.type] || item.type;

                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-badge flex-shrink-0 ${typeColor}`}>
                          {typeLabel}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {item.title || '—'}
                          </p>
                          {item.note && (
                            <p className="text-xs text-text-muted truncate">{item.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <ClockIcon />{formatDate(item.date)}
                        </span>
                        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{hours.toFixed(1)}ч
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                История активности пуста
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}