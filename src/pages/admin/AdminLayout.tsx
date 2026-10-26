import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Feather, Settings2 } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { useSiteSettings } from '../../lib/siteSettingsContext';

export const AdminLayout: React.FC = () => {
  const { signOut, user, isDemoAdmin } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Keluar dari ruang pengelola utas?')) {
      await signOut();
      navigate('/admin/login');
    }
  };

  return (
    <div className="admin-shell flex min-h-screen flex-col text-coklat-tua">
      <a className="skip-link" href="#main-content">Lewati ke konten</a>
      <header className="sticky top-0 z-40 border-b border-garis/90 bg-kertas/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:min-h-[76px] sm:px-6 lg:px-8">
          <Link to="/admin" className="flex min-w-0 items-center gap-2.5 text-coklat-tua transition-colors hover:text-lumut">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-garis bg-krem text-lumut">
              <Feather className="h-[17px] w-[17px]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-playfair text-lg font-semibold leading-none sm:text-xl">{settings.site_name}</span>
              <span className="mt-1 block text-[13px] leading-snug text-coklat-sedang">
                Meja kerja{isDemoAdmin ? ' · Mode demo' : ''}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to="/admin/pengaturan"
              aria-label="Pengaturan personalisasi dan Telegram"
              title="Pengaturan"
              className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-xl text-coklat-sedang transition-colors hover:bg-krem hover:text-coklat-tua sm:w-auto sm:border sm:border-garis sm:px-3.5"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden text-sm font-medium sm:inline">Pengaturan</span>
            </Link>
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              aria-label="Buka lini masa publik di tab baru"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-garis px-2.5 text-sm font-medium text-coklat-sedang transition-colors hover:bg-krem hover:text-coklat-tua sm:px-3.5"
            >
              <span className="hidden sm:inline">Lihat lini masa</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title={`Keluar (${user?.email || 'Admin'})`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-coklat-sedang transition-colors hover:bg-red-50 hover:text-red-700"
              aria-label="Keluar dari akun admin"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-garis/80 bg-kertas/55 px-4 py-4 text-center text-[13px] text-coklat-sedang">
        Ruang pengelola {settings.site_name}
      </footer>
    </div>
  );
};
