import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ProfilePage from './pages/ProfilePage';
import RatingPage from './pages/RatingPage';
import EventCreatePage from './pages/EventCreatePage';
import EventEditPage from './pages/EventEditPage';
import RegistrationPage from './pages/RegistrationPage';
import HrVolunteersPage from './pages/HrVolunteersPage';
import HrVolunteerDetailPage from './pages/HrVolunteerDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminLogsPage from './pages/AdminLogsPage';
import StrikesPage from './pages/StrikesPage';
import AppealsPage from './pages/AppealsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import QrCheckinPage from './pages/QrCheckinPage';

// Заглушка для страниц, которых ещё нет
function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">{title}</h2>
      <p className="text-sm text-text-muted max-w-xs">
        Эта страница находится в разработке и скоро будет доступна.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные страницы */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkin/:id" element={<QrCheckinPage />} />

          {/* Защищённые страницы — AppLayout сам проверяет токен */}
          <Route element={<AppLayout />}>

            {/* ── Мероприятия ── */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventCreatePage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/edit" element={<EventEditPage />} />

            {/* ── Профиль и рейтинг ── */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rating" element={<RatingPage />} />

            {/* ── Личный кабинет волонтёра (приоритет 4) ── */}
            <Route path="/strikes" element={<StrikesPage />} />
            <Route path="/appeals" element={<AppealsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* ── Мои мероприятия (заглушка — логика уже есть в EventsPage на вкладке) ── */}
            <Route path="/my-events" element={<PlaceholderPage title="Мои мероприятия" />} />

            {/* ── HR-страницы ── */}
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/hr/volunteers" element={<HrVolunteersPage />} />
            <Route path="/hr/volunteers/:id" element={<HrVolunteerDetailPage />} />
            <Route path="/analytics" element={<PlaceholderPage title="Аналитика" />} />

            {/* ── Админ-панель (SUPER_ADMIN) ── */}
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />

            {/* ── Редиректы ── */}
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}