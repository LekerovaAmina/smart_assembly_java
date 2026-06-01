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




// Страницы-заглушки для маршрутов из сайдбара
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
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            {/* Основные страницы */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventCreatePage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/edit" element={<EventEditPage />} />

            {/* Профиль и рейтинг */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rating" element={<RatingPage />} />

            <Route path="/hr/volunteers" element={<HrVolunteersPage />} />
            <Route path="/hr/volunteers/:id" element={<HrVolunteerDetailPage />} />

            {/* Волонтёрские страницы */}
            <Route path="/my-events" element={<PlaceholderPage title="Мои мероприятия" />} />
            <Route path="/strikes" element={<PlaceholderPage title="Мои страйки" />} />
            <Route path="/appeals" element={<PlaceholderPage title="Апелляции" />} />
            <Route path="/statistics" element={<PlaceholderPage title="Статистика часов" />} />

            {/* HR-страницы */}
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/analytics" element={<PlaceholderPage title="Аналитика" />} />
            <Route path="/settings" element={<PlaceholderPage title="Настройки" />} />

            {/* Редиректы */}
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


