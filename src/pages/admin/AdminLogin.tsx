import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Feather, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useSiteSettings } from '../../lib/siteSettingsContext';

export const AdminLogin: React.FC = () => {
  const { signIn, user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) setErrorMsg(error);
      else navigate('/admin', { replace: true });
    } catch {
      setErrorMsg('Gagal masuk. Periksa kembali sambungan Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasConfiguredSupabase = isSupabaseConfigured();

  return (
    <div className="admin-shell flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6">
      <a className="skip-link" href="#login-form">Lewati ke formulir masuk</a>
      <div className="w-full max-w-[440px]">
        <Link to="/" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 text-sm font-medium text-coklat-sedang transition-colors hover:text-lumut">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Kembali ke halaman publik</span>
        </Link>

        <section className="paper-card rounded-2xl p-5 shadow-journal-lg sm:p-8" aria-labelledby="login-title">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-garis bg-krem text-lumut">
              <Feather className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 id="login-title" className="font-playfair text-3xl font-semibold tracking-tight text-coklat-tua sm:text-[2.15rem]">
              Ruang pengelola
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-coklat-sedang sm:text-base">
              Masuk untuk menulis dan mengelola utas {settings.site_name}.
            </p>
          </div>

          {!hasConfiguredSupabase && (
            <div className="mb-5 rounded-xl border border-lumut/25 bg-lumut/10 p-4 text-sm leading-relaxed text-coklat-tua">
              <p className="font-semibold text-lumut">Pratinjau lokal</p>
              <p className="mt-1 text-coklat-sedang">Gunakan akun demo untuk membuka meja kerja:</p>
              <p className="mt-3 rounded-lg bg-kertas px-3 py-2.5 text-sm leading-relaxed">
                <span className="block">Email: <strong className="select-all">admin@lebarsenja.com</strong></span>
                <span className="block">Sandi: <strong className="select-all">senja123</strong></span>
              </p>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="login-form" tabIndex={-1} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="field-label">Alamat email</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@domain.com"
                className="field-control px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="field-label">Kata sandi</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
                className="field-control px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coklat-tua px-5 text-base font-semibold text-kertas shadow-sm transition-colors hover:bg-lumut active:scale-[.99] disabled:cursor-wait disabled:opacity-60"
            >
              <Lock className="h-4 w-4 text-[#DCE4D6]" aria-hidden="true" />
              <span>{isSubmitting ? 'Memeriksa akses…' : 'Masuk ke ruang tulis'}</span>
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-[13px] text-coklat-sedang">
          Akses khusus untuk pengelola {settings.site_name}
        </p>
      </div>
    </div>
  );
};
