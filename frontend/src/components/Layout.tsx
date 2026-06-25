import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 rounded-lg transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg p-5">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">
          DeadlineHero
        </h1>

        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            📊 Dashboard
          </NavLink>

          <NavLink to="/tasks" className={linkClass}>
            ✅ Tasks
          </NavLink>

          <NavLink to="/calendar" className={linkClass}>
            📅 Calendar
          </NavLink>

          <NavLink to="/analytics" className={linkClass}>
            📈 Analytics
          </NavLink>

          <NavLink to="/settings" className={linkClass}>
            ⚙️ Settings
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;