import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, Settings, FileText } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors';
    return isActive
      ? `${base} bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300`
      : `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage system configuration, monitor health, and view metrics.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-1">
          <nav className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <ul className="space-y-1">
              <li>
                <NavLink to="/admin" end className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  Overview
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/observability" className={navLinkClass}>
                  <Activity className="w-4 h-4" />
                  Observability
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <Users className="w-4 h-4" />
                  Users
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/config" className={navLinkClass}>
                  <Settings className="w-4 h-4" />
                  Configuration
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/audit" className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  Audit Logs
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="md:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
