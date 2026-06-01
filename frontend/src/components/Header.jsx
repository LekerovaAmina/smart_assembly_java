import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || 'Пользователь'
    : 'Пользователь';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 bg-surface border-b border-border flex items-center justify-end px-6 h-14 z-20"
      style={{ left: '240px' }}
    >
      {/* Notifications */}
      <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-gray-50">
        <BellIcon />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
      </button>

      {/* User menu */}
      <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
        <div className="w-7 h-7 rounded-full bg-gray-100 border border-border flex items-center justify-center text-text-secondary">
          <UserIcon />
        </div>
        <span className="text-sm font-medium text-text-primary">{displayName}</span>
        <button
          onClick={handleLogout}
          className="ml-2 text-xs text-text-muted hover:text-primary transition-colors"
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
