import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Header />
      <main
        className="pt-14 min-h-screen"
        style={{ marginLeft: '240px' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
