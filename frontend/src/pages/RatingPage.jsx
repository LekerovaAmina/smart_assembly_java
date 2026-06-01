import { useState, useEffect } from 'react';
import { getRating } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  VOLUNTEER: 'bg-green-100 text-green-700',
  HR: 'bg-orange-100 text-orange-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  ACTIVIST: 'bg-orange-100 text-orange-700',
};

const ROLE_LABELS = {
  VOLUNTEER: 'Волонтёр',
  HR: 'HR',
  ADMIN: 'Администратор',
  ACTIVIST: 'Активист',
};

function MedalIcon({ place }) {
  if (place === 1) return <span className="text-yellow-500 font-bold text-base">1</span>;
  if (place === 2) return <span className="text-gray-400 font-bold text-base">2</span>;
  if (place === 3) return <span className="text-amber-600 font-bold text-base">3</span>;
  return <span className="font-medium text-text-secondary text-sm">{place}</span>;
}

function PlaceBadge({ place }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold';
  if (place === 1) return <div className={`${base} bg-yellow-100 text-yellow-600`}><MedalIcon place={place} /></div>;
  if (place === 2) return <div className={`${base} bg-gray-100 text-gray-500`}><MedalIcon place={place} /></div>;
  if (place === 3) return <div className={`${base} bg-amber-50 text-amber-600`}><MedalIcon place={place} /></div>;
  return (
    <div className={`${base} bg-transparent`}>
      <span className="text-sm text-text-muted font-medium">{place}</span>
    </div>
  );
}

const UserCircle = () => (
  <div className="w-8 h-8 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted flex-shrink-0">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

export default function RatingPage() {
  const { user: currentUser } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRating = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRating();
        const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
        // Sort by totalHours descending
        const sorted = [...data].sort((a, b) => (b.totalHours ?? 0) - (a.totalHours ?? 0));
        setVolunteers(sorted);
      } catch (err) {
        setError('Не удалось загрузить рейтинг');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRating();
  }, []);

  const myPlace = currentUser
    ? volunteers.findIndex(v => v.id === currentUser.id || v.uniqueId === currentUser.uniqueId) + 1
    : 0;

  const myName = currentUser
    ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Вы'
    : 'Вы';

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Рейтинг</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Table */}
        <div className="col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="bg-surface rounded-card border border-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border">
              <div className="col-span-1 text-xs text-text-muted font-medium">Место</div>
              <div className="col-span-5 text-xs text-text-muted font-medium">ФИО</div>
              <div className="col-span-4 text-xs text-text-muted font-medium">Роль</div>
              <div className="col-span-2 text-xs text-text-muted font-medium text-right">Часы</div>
            </div>

            {loading ? (
              <div className="divide-y divide-border animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-1 h-8 w-8 bg-gray-100 rounded-full" />
                    <div className="col-span-5 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full" />
                      <div className="h-4 w-28 bg-gray-100 rounded" />
                    </div>
                    <div className="col-span-4 h-5 w-20 bg-gray-100 rounded-badge" />
                    <div className="col-span-2 h-4 w-8 bg-gray-100 rounded ml-auto" />
                  </div>
                ))}
              </div>
            ) : volunteers.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-sm">
                Данные рейтинга недоступны
              </div>
            ) : (
              <div className="divide-y divide-border">
                {volunteers.map((volunteer, index) => {
                  const place = index + 1;
                  const isMe = volunteer.id === currentUser?.id || volunteer.uniqueId === currentUser?.uniqueId;
                  const roleKey = volunteer.role?.toUpperCase() ?? '';
                  const roleLabel = ROLE_LABELS[roleKey] ?? volunteer.role ?? 'Волонтёр';
                  const roleColor = ROLE_COLORS[roleKey] ?? 'bg-gray-100 text-gray-600';
                  const name = isMe
                    ? 'Вы'
                    : [volunteer.firstName, volunteer.lastName?.charAt(0) ? `${volunteer.lastName.charAt(0)}.` : ''].filter(Boolean).join(' ')
                      || volunteer.fullName
                      || 'Участник';

                  return (
                    <div
                      key={volunteer.id ?? index}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${isMe ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <PlaceBadge place={place} />
                      </div>
                      <div className="col-span-5 flex items-center gap-2.5">
                        <UserCircle />
                        <span className={`text-sm font-medium ${isMe ? 'text-primary' : 'text-text-primary'}`}>
                          {name}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-badge ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-semibold ${isMe ? 'text-primary' : 'text-text-primary'}`}>
                          {volunteer.totalHours ?? 0}ч
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {myPlace > 0 && (
            <div className="bg-surface rounded-card border border-border p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">
                Поздравляем вас!
              </h3>
              <p className="text-sm text-text-secondary">
                Вы на{' '}
                <span className="text-primary font-semibold">{myPlace} месте</span>{' '}
                в рейтинге этого месяца
              </p>
            </div>
          )}

          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Мои часы</h3>
            <p className="text-sm text-text-muted">Статистика часов в разработке</p>
          </div>
        </div>
      </div>
    </div>
  );
}
