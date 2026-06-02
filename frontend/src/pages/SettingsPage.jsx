import { useState, useEffect } from 'react';
import { getMe } from '../api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  VOLUNTEER: 'Волонтёр',
  HR: 'HR-менеджер',
  SUPER_ADMIN: 'Администратор',
  COORDINATOR: 'Координатор',
  MEMBER: 'Участник',
};

const STATUS_LABELS = {
  ACTIVE: 'Активен',
  VOLUNTEER: 'Волонтёр',
  INACTIVE: 'Неактивен',
  BANNED: 'Заблокирован',
  MEMBER: 'Участник',
  BOARD_MEMBER: 'Член совета',
  ECO_YOUTH: 'Эко молодёжь',
  LEFT: 'Выбыл',
  REMOTE: 'Дистанционно',
};

function InfoField({ label, value, locked = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${
        locked
          ? 'bg-gray-50 border-border text-text-secondary'
          : 'bg-white border-border text-text-primary'
      }`}>
        <span className="flex-1">{value || '—'}</span>
        {locked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>
      {locked && (
        <p className="text-xs text-text-muted mt-1">Изменяется через HR</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch {
        setError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-100 rounded-card" />
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
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : authUser?.firstName ?? '';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Настройки</h1>
        <p className="text-sm text-text-muted mt-1">Информация вашего аккаунта</p>
      </div>

      {/* Аватар + имя */}
      <div className="bg-white rounded-card border border-border p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
            {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">{fullName || '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-badge font-medium">
                {ROLE_LABELS[user?.role] ?? user?.role ?? '—'}
              </span>
              <span className="text-xs text-text-muted">
                {STATUS_LABELS[user?.status] ?? user?.status ?? ''}
              </span>
            </div>
            {user?.uniqueId && (
              <p className="text-xs text-text-muted mt-1">ID: {user.uniqueId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoField label="Имя" value={user?.firstName} locked />
          <InfoField label="Фамилия" value={user?.lastName} locked />
          <InfoField label="Телефон" value={user?.phone} locked />
          <InfoField label="Email" value={user?.email} locked />
        </div>
      </div>

      {/* Волонтёрская статистика */}
      <div className="bg-white rounded-card border border-border p-6 mb-4">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Статистика</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {parseFloat(user?.totalHours ?? 0).toFixed(1)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Часов всего</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              (user?.strikeCount ?? 0) > 0 ? 'text-red-600' : 'text-text-muted'
            }`}>
              {user?.strikeCount ?? 0}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Страйков</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-secondary">
              {user?.departmentId ? `#${user.departmentId}` : '—'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">Отделение</p>
          </div>
        </div>
      </div>

      {/* Аккаунт создан */}
      {user?.createdAt && (
        <div className="bg-white rounded-card border border-border p-6 mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Аккаунт</h3>
          <div className="text-sm text-text-secondary">
            Аккаунт создан:{' '}
            <span className="font-medium text-text-primary">
              {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Информационный блок */}
      <div className="bg-orange-50 border border-orange-200 rounded-card p-4 mb-6">
        <p className="text-sm text-orange-800">
          <span className="font-semibold">Изменение данных</span> — для смены телефона, имени или email
          обратитесь к HR-менеджеру вашего отделения.
        </p>
      </div>

      {/* Выход */}
      <div className="bg-white rounded-card border border-border p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Выход из аккаунта</h3>
        <p className="text-sm text-text-muted mb-4">
          После выхода потребуется повторная авторизация по SMS.
        </p>
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-medium rounded-btn transition-colors cursor-pointer"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}