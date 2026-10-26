import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/authContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SiteSettingsProvider } from './lib/siteSettingsContext';

// Public Utas Page
import { Threads } from './pages/Threads';

// Admin Pages (Direct URL only)
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminThreads } from './pages/admin/AdminThreads';
import { AdminSettings } from './pages/admin/AdminSettings';

export default function App() {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public: Hanya Laman Utas */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Threads />} />
            </Route>

            {/* Admin Login (Diakses langsung via URL /admin/login tanpa tombol publik) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin: Meja Kerja Utas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminThreads />} />
                <Route path="pengaturan" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>

            {/* Redirect halaman lama ke beranda utas */}
            <Route path="/buku" element={<Navigate to="/" replace />} />
            <Route path="/buku/*" element={<Navigate to="/" replace />} />
            <Route path="/utas" element={<Navigate to="/" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
