import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUnreadNotificationsCount, getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';

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

const NOTIF_TYPE_COLORS = {
  EVENT: 'bg-blue-50 text-blue-600',
  STRIKE: 'bg-red-50 text-red-600',
  REGISTRATION: 'bg-green-50 text-green-600',
  SYSTEM: 'bg-gray-50 text-gray-600',
};

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    const days = Math.floor(hours / 24);
    return `${days} д назад`;
  } catch { return ''; }
}

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Header({ onMenuToggle, mobileMenuOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || 'Пользователь'
    : 'Пользователь';

  // Подгружаем счётчик непрочитанных каждые 60 секунд
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadNotificationsCount();
        setUnreadCount(res.data?.count ?? 0);
      } catch {
        // тихо игнорируем
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Закрыть дропдаун при клике вне
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifications = async () => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const res = await getNotifications({ size: 15 });
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data?.content ?? []);
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* тихо */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* тихо */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:left-[240px] bg-surface border-b border-border flex items-center justify-end px-4 md:px-6 h-14 z-20 gap-3">
      {/* Mobile hamburger */}
      <button
        className="md:hidden mr-auto p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
        onClick={onMenuToggle}
        aria-label="Меню"
      >
        {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={openNotifications}
          className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-gray-50"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {notifOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-surface rounded-card border border-border shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Прочитать все
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifLoading ? (
                <div className="py-8 text-center text-sm text-text-muted">Загрузка...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">Нет уведомлений</div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'} truncate`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                          {notif.body}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="flex items-center gap-2 pl-3 border-l border-border">
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