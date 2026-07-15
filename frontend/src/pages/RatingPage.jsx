import { useState, useEffect } from 'react';
import { getRating } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  VOLUNTEER: 'bg-green-100 text-green-700',
  MEMBER: 'bg-gray-100 text-gray-600',
  HR: 'bg-orange-100 text-orange-700',
  COORDINATOR: 'bg-blue-100 text-blue-700',
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
};

const ROLE_LABELS = {
  VOLUNTEER: 'Волонтёр',
  MEMBER: 'Участник',
  HR: 'HR',
  COORDINATOR: 'Координатор',
  SUPER_ADMIN: 'Администратор',
};

function PlaceBadge({ place }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0';
  if (place === 1) return <div className={`${base} bg-yellow-100 text-yellow-600`}>1</div>;
  if (place === 2) return <div className={`${base} bg-gray-100 text-gray-500`}>2</div>;
  if (place === 3) return <div className={`${base} bg-amber-50 text-amber-600`}>3</div>;
  return <div className={`${base} bg-transparent`}><span className="text-sm text-text-muted font-medium">{place}</span></div>;
}

const UserCircle = () => (
  <div className="w-8 h-8 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted flex-shrink-0">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

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
        // /api/rating возвращает List<RatingEntryDto> — уже отсортированный массив
        const data = Array.isArray(res.data) ? res.data : [];
        setVolunteers(data);
      } catch (err) {
        setError('Не удалось загрузить рейтинг');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRating();
  }, []);

  // Ищем себя по id из JWT-данных
  const myPlace = currentUser
    ? volunteers.findIndex(v => String(v.id) === String(currentUser.userId)) + 1
    : 0;

  const myEntry = myPlace > 0 ? volunteers[myPlace - 1] : null;

  const monthLabel = MONTH_NAMES[new Date().getMonth()];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Волонтёр месяца</h1>
      <p className="text-sm text-text-muted mb-6">
        Рейтинг по часам, отработанным в этом месяце ({monthLabel})
      </p>

      <div className="grid grid-cols-3 gap-6">
        {/* Table */}
        <div className="col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="bg-surface rounded-card border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border bg-gray-50">
              <div className="col-span-1 text-xs text-text-muted font-medium">Место</div>
              <div className="col-span-5 text-xs text-text-muted font-medium">Участник</div>
              <div className="col-span-4 text-xs text-text-muted font-medium">Роль</div>
              <div className="col-span-2 text-xs text-text-muted font-medium text-right">Часы (месяц)</div>
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
                  const isMe = String(volunteer.id) === String(currentUser?.userId);
                  const roleKey = volunteer.role?.toUpperCase() ?? '';
                  const roleLabel = ROLE_LABELS[roleKey] ?? volunteer.role ?? 'Волонтёр';
                  const roleColor = ROLE_COLORS[roleKey] ?? 'bg-gray-100 text-gray-600';

                  const displayName = isMe
                    ? 'Вы'
                    : [volunteer.firstName, volunteer.lastName]
                        .filter(Boolean)
                        .join(' ') || 'Участник';

                  return (
                    <div
                      key={volunteer.id ?? index}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors ${
                        isMe ? 'bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="col-span-1 flex items-center justify-center">
                        <PlaceBadge place={place} />
                      </div>
                      <div className="col-span-5 flex items-center gap-2.5">
                        <UserCircle />
                        <span className={`text-sm font-medium ${isMe ? 'text-primary' : 'text-text-primary'}`}>
                          {displayName}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-badge ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-sm font-semibold ${isMe ? 'text-primary' : 'text-text-primary'}`}>
                          {parseFloat(volunteer.monthlyHours ?? 0).toFixed(1)}ч
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {myPlace > 0 && myEntry && (
            <div className="bg-surface rounded-card border border-border p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Ваша позиция</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-lg">
                  {myPlace}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {myPlace} место из {volunteers.length}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {parseFloat(myEntry.monthlyHours ?? 0).toFixed(1)} часов за месяц
                  </p>
                </div>
              </div>

              {myPlace > 1 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">
                    До {myPlace - 1} места:
                    <span className="font-semibold text-primary ml-1">
                      {(parseFloat(volunteers[myPlace - 2]?.monthlyHours ?? 0) - parseFloat(myEntry.monthlyHours ?? 0)).toFixed(1)}ч
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Топ-3</h3>
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {volunteers.slice(0, 3).map((v, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={v.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{medals[i]}</span>
                        <span className="text-sm text-text-primary truncate max-w-[100px]">
                          {[v.firstName, v.lastName].filter(Boolean).join(' ') || 'Участник'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">
                        {parseFloat(v.monthlyHours ?? 0).toFixed(1)}ч
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-card border border-border p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Всего участников</h3>
            <p className="text-3xl font-bold text-primary">{volunteers.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}