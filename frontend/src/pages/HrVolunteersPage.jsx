import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../api';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  VOLUNTEER: 'Волонтёр', HR: 'HR', SUPER_ADMIN: 'Администратор',
  COORDINATOR: 'Координатор', MEMBER: 'Участник',
};

const STATUS_LABELS = {
  ACTIVE: 'Активен', INACTIVE: 'Неактивен', BANNED: 'Заблокирован',
  VOLUNTEER: 'Волонтёр', MEMBER: 'Участник',
};

function StatusBadge({ status }) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-500',
    BANNED: 'bg-red-100 text-red-600',
    VOLUNTEER: 'bg-orange-100 text-orange-700',
    MEMBER: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-badge font-medium ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const UserIcon = () => (
  <div className="w-9 h-9 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-muted flex-shrink-0">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  </div>
);

export default function HrVolunteersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { size: PAGE_SIZE, page, sort: 'lastName,asc' };
      if (search) params.search = search;
      const res = await getUsers(params);
      const data = res.data;
      setUsers(Array.isArray(data) ? data : (data?.content ?? []));
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      setError('Не удалось загрузить список волонтёров');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Волонтёры</h1>
          <p className="text-sm text-text-muted mt-1">Всего: {total}</p>
        </div>
      </div>

      {/* Поиск */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Поиск по имени, телефону, ID..."
          className="flex-1 border border-border rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button type="submit"
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary-hover transition-colors cursor-pointer">
          Найти
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-btn hover:bg-gray-200 transition-colors cursor-pointer">
            Сбросить
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {/* Таблица */}
      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border">
          <div className="col-span-4 text-xs text-text-muted font-medium">Волонтёр</div>
          <div className="col-span-3 text-xs text-text-muted font-medium">Телефон</div>
          <div className="col-span-2 text-xs text-text-muted font-medium">Роль</div>
          <div className="col-span-1 text-xs text-text-muted font-medium">Статус</div>
          <div className="col-span-1 text-xs text-text-muted font-medium text-right">Часы</div>
          <div className="col-span-1 text-xs text-text-muted font-medium text-right">Страйки</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <div className="w-9 h-9 bg-gray-100 rounded-full" />
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                </div>
                <div className="col-span-3 h-4 w-28 bg-gray-100 rounded" />
                <div className="col-span-2 h-5 w-20 bg-gray-100 rounded-badge" />
                <div className="col-span-1 h-5 w-16 bg-gray-100 rounded-badge" />
                <div className="col-span-1 h-4 w-10 bg-gray-100 rounded ml-auto" />
                <div className="col-span-1 h-4 w-8 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">
            {search ? 'Ничего не найдено' : 'Нет волонтёров'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map(user => (
              <div key={user.id}
                onClick={() => navigate(`/hr/volunteers/${user.id}`)}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="col-span-4 flex items-center gap-2.5">
                  <UserIcon />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {user.lastName} {user.firstName}
                    </p>
                    <p className="text-xs text-text-muted">{user.uniqueId || '—'}</p>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-text-secondary">{user.phone}</div>
                <div className="col-span-2">
                  <span className="text-xs text-text-muted">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <div className="col-span-1">
                  <StatusBadge status={user.status} />
                </div>
                <div className="col-span-1 text-right text-sm font-semibold text-text-primary">
                  {user.totalHours ?? 0}ч
                </div>
                <div className={`col-span-1 text-right text-sm font-semibold ${
                  (user.strikeCount ?? 0) > 0 ? 'text-red-600' : 'text-text-muted'}`}>
                  {user.strikeCount ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            ← Назад
          </button>
          <span className="text-sm text-text-muted px-4">
            {page + 1} из {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}