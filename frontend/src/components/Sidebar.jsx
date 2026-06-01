import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 17 16 21" />
    <line x1="12" y1="17" x2="12" y2="11" />
    <path d="M7 4H17L15 11H9L7 4z" />
    <path d="M7 4C7 4 5 4 5 7C5 9 7 11 7 11H9" />
    <path d="M17 4C17 4 19 4 19 7C19 9 17 11 17 11H15" />
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ScaleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" />
    <path d="M5 6l7-3 7 3" />
    <path d="M5 6l-2 9h4l-2-9z" />
    <path d="M19 6l-2 9h4l-2-9z" />
    <path d="M5 21h14" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const navItems = [
  { to: '/events', label: 'Мероприятия', Icon: CalendarIcon },
  { to: '/rating', label: 'Рейтинг', Icon: TrophyIcon },
  { to: '/my-events', label: 'Мои мероприятия', Icon: ListIcon },
  { to: '/strikes', label: 'Страйки', Icon: AlertIcon },
  { to: '/statistics', label: 'Статистика', Icon: BarChartIcon },
];

const hrNavItems = [
  { to: '/analytics', label: 'Аналитика', Icon: TrendingUpIcon },
  { to: '/appeals', label: 'Апелляции', Icon: ScaleIcon },
];

export default function Sidebar() {
  const { isHr } = useAuth();

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 bg-sidebar border-r border-border flex flex-col z-30"
      style={{ width: '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          Ж
        </div>
        <span className="font-semibold text-text-primary text-sm leading-tight">
          Ассамблея Жастары
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
                    isActive
                      ? 'bg-orange-50 text-primary border-l-4 border-primary pl-2'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {isHr && (
          <ul className="space-y-0.5 px-2 mt-2 pt-2 border-t border-border">
            {hrNavItems.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
                      isActive
                        ? 'bg-orange-50 text-primary border-l-4 border-primary pl-2'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                    }`
                  }
                >
                  <Icon />
                  {label}
                  <span className="ml-auto text-xs bg-primary text-white px-1.5 py-0.5 rounded font-semibold">
                    HR
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Settings */}
      <div className="px-2 py-3 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
              isActive
                ? 'bg-orange-50 text-primary border-l-4 border-primary pl-2'
                : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
            }`
          }
        >
          <SettingsIcon />
          Настройки
        </NavLink>
      </div>
    </aside>
  );
}
