import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { GeneratePage } from './pages/GeneratePage';
import { SchemasPage } from './pages/SchemasPage';
import { JobsPage } from './pages/JobsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminObservability } from './pages/admin/AdminObservability';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminConfig } from './pages/admin/AdminConfig';
import { AdminAudit } from './pages/admin/AdminAudit';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserProfile } from './components/UserProfile';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="generate" element={<GeneratePage />} />
          <Route path="schemas" element={<SchemasPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="login" element={<LoginPage />} />

          {/* Admin Routes - Protected */}
          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="observability" element={<AdminObservability />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="audit" element={<AdminAudit />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
