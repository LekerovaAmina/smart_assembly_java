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
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <Header />
      <main
        className="pt-[70px] pb-8 px-8"
        style={{ marginLeft: '240px' }}
      >
        <div className="max-w-7xl mx-auto pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}