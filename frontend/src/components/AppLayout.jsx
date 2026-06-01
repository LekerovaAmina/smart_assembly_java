import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Сайдбар */}
      <aside className="sidebar-container">
        <div className="flex flex-col gap-2">
          <div className="px-4 py-4 text-xl font-bold text-primary">
            Ассамблея Жастары
          </div>
          <nav className="flex flex-col gap-1">
            <a href="#" className="sidebar-link sidebar-link-active">Главная</a>
            <a href="#" className="sidebar-link">Мероприятия</a>
            <a href="#" className="sidebar-link">Волонтеры</a>
          </nav>
        </div>
      </aside>

      {/* Хедер */}
      <header className="header-panel">
        <h1 className="text-lg font-semibold text-sidebar-text">Панель управления</h1>
        <div className="flex items-center gap-4">
          <span className="badge-management">Администратор</span>
        </div>
      </header>

      {/* Основной контент */}
      <main className="main-content-layout">
        <Outlet /> {}
      </main>
    </div>
  );
}