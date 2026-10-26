import React, { useEffect, useState } from 'react';
import { AlertCircle, Bot, CheckCircle, LoaderCircle, Save, ShieldCheck, Unplug } from 'lucide-react';
import { useSiteSettings } from '../../lib/siteSettingsContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { SiteSettings } from '../../types';

interface TelegramStatus {
  configured: boolean;
  enabled: boolean;
  botUsername: string | null;
  telegramUserId: string | null;
}

async function telegramAdminRequest<T>(method: 'GET' | 'POST' | 'DELETE', body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('telegram-admin', { method, body });
  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const responseBody = await context.clone().json().catch(() => null) as { error?: string } | null;
      throw new Error(responseBody?.error || error.message);
    }
    throw error;
  }
  return data as T;
}

const EMPTY_TELEGRAM_STATUS: TelegramStatus = {
  configured: false,
  enabled: false,
  botUsername: null,
  telegramUserId: null,
};

export const AdminSettings: React.FC = () => {
  const { settings, saveSettings, isLoading: isSettingsLoading } = useSiteSettings();
  const [siteName, setSiteName] = useState(settings.site_name);
  const [username, setUsername] = useState(settings.username);
  const [tagline, setTagline] = useState(settings.tagline);
  const [isSavingSite, setIsSavingSite] = useState(false);
  const [siteFeedback, setSiteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [telegramToken, setTelegramToken] = useState('');
  const [telegramUserId, setTelegramUserId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState(EMPTY_TELEGRAM_STATUS);
  const [isTelegramLoading, setIsTelegramLoading] = useState(isSupabaseConfigured());
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramFeedback, setTelegramFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isSettingsLoading) return;
    setSiteName(settings.site_name);
    setUsername(settings.username);
    setTagline(settings.tagline);
  }, [isSettingsLoading, settings]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    telegramAdminRequest<TelegramStatus>('GET')
      .then((status) => {
        if (!active) return;
        setTelegramStatus(status);
        setTelegramUserId(status.telegramUserId ?? '');
      })
      .catch((error: unknown) => {
        if (active) setTelegramFeedback({
          type: 'error',
          message: error instanceof Error ? error.message : 'Status bot gagal dimuat.',
        });
      })
      .finally(() => { if (active) setIsTelegramLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSaveSite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSiteFeedback(null);
    const cleanUsername = username.trim().replace(/^@+/, '');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(cleanUsername)) {
      setSiteFeedback({ type: 'error', message: 'Username hanya boleh berisi huruf, angka, titik, atau garis bawah.' });
      return;
    }

    const nextSettings: SiteSettings = {
      site_name: siteName.trim(),
      username: cleanUsername,
      tagline: tagline.trim(),
    };
    setIsSavingSite(true);
    try {
      await saveSettings(nextSettings);
      setSiteFeedback({ type: 'success', message: 'Personalisasi berhasil disimpan.' });
    } catch (error) {
      setSiteFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Pengaturan gagal disimpan.' });
    } finally {
      setIsSavingSite(false);
    }
  };

  const handleSaveTelegram = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTelegramFeedback(null);
    if (!isSupabaseConfigured()) {
      setTelegramFeedback({ type: 'error', message: 'Hubungkan Supabase terlebih dahulu untuk memakai bot Telegram.' });
      return;
    }

    setIsSavingTelegram(true);
    try {
      const status = await telegramAdminRequest<TelegramStatus>('POST', {
        botToken: telegramToken.trim(),
        telegramUserId: telegramUserId.trim(),
      });
      setTelegramStatus(status);
      setTelegramToken('');
      setTelegramFeedback({ type: 'success', message: 'Bot Telegram berhasil dihubungkan.' });
    } catch (error) {
      setTelegramFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Bot gagal dihubungkan.' });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!window.confirm('Putuskan koneksi bot Telegram? Bot tidak akan bisa menerbitkan utas sampai dihubungkan lagi.')) return;
    setTelegramFeedback(null);
    setIsSavingTelegram(true);
    try {
      const status = await telegramAdminRequest<TelegramStatus>('DELETE');
      setTelegramStatus(status);
      setTelegramUserId('');
      setTelegramToken('');
      setTelegramFeedback({ type: 'success', message: 'Koneksi bot Telegram diputus.' });
    } catch (error) {
      setTelegramFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Bot gagal diputus.' });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1 border-b border-garis pb-4">
        <h1 className="font-playfair text-2xl font-semibold text-coklat-tua sm:text-3xl">Pengaturan</h1>
        <p className="text-sm leading-relaxed text-coklat-sedang">Personalisasi halaman dan sambungkan bot Telegram untuk menerbitkan utas.</p>
      </header>

      <section className="paper-card rounded-2xl p-4 sm:p-6" aria-labelledby="personalization-title">
        <div className="mb-5 flex items-start gap-3 border-b border-garis/80 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-garis bg-krem text-lumut">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="personalization-title" className="font-playfair text-xl font-semibold text-coklat-tua">Personalisasi</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-coklat-sedang">Nama aplikasi dan username tampil di halaman publik serta balasan.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSite} className="space-y-4">
          <div>
            <label htmlFor="settings-site-name" className="field-label">Nama aplikasi</label>
            <input
              id="settings-site-name"
              type="text"
              required
              maxLength={80}
              value={siteName}
              onChange={(event) => setSiteName(event.target.value)}
              placeholder="Nama jurnal Anda"
              className="field-control px-3.5 py-3"
            />
          </div>
          <div>
            <label htmlFor="settings-username" className="field-label">Username</label>
            <div className="flex items-stretch">
              <span className="flex items-center rounded-l-xl border border-r-0 border-garis bg-krem px-3 font-reading text-base text-coklat-sedang">@</span>
              <input
                id="settings-username"
                type="text"
                required
                maxLength={30}
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/^@+/, ''))}
                placeholder="username"
                autoComplete="nickname"
                className="field-control rounded-l-none px-3.5 py-3"
              />
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-coklat-sedang">Gunakan huruf, angka, titik, atau garis bawah. Tampilan akan memakai awalan @.</p>
          </div>
          <div>
            <label htmlFor="settings-tagline" className="field-label">Deskripsi singkat</label>
            <input
              id="settings-tagline"
              type="text"
              required
              maxLength={160}
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="Kalimat pendek tentang jurnal Anda"
              className="field-control px-3.5 py-3"
            />
          </div>
          {siteFeedback && (
            <div role={siteFeedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${siteFeedback.type === 'success' ? 'border-lumut/25 bg-lumut/10 text-coklat-tua' : 'border-red-200 bg-red-50 text-red-800'}`}>
              {siteFeedback.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>{siteFeedback.message}</span>
            </div>
          )}
          <div className="flex justify-end border-t border-garis/80 pt-4">
            <button type="submit" disabled={isSavingSite || isSettingsLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-coklat-tua px-4 text-sm font-semibold text-kertas transition-colors hover:bg-lumut disabled:cursor-wait disabled:opacity-60">
              {isSavingSite ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              <span>{isSavingSite ? 'Menyimpan…' : 'Simpan personalisasi'}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="paper-card rounded-2xl p-4 sm:p-6" aria-labelledby="telegram-title">
        <div className="mb-5 flex items-start gap-3 border-b border-garis/80 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-garis bg-krem text-lumut">
            <Bot className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="telegram-title" className="font-playfair text-xl font-semibold text-coklat-tua">Bot Telegram</h2>
              {telegramStatus.enabled && <span className="rounded-full border border-lumut/25 bg-lumut/10 px-2.5 py-1 text-[13px] font-medium text-lumut">Terhubung</span>}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-coklat-sedang">Kirim perintah pribadi untuk menerbitkan utas atau membalas utas yang sudah terbit.</p>
          </div>
        </div>

        {telegramStatus.enabled && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-lumut/20 bg-lumut/5 px-3.5 py-3 text-sm">
            <span className="text-coklat-tua">Bot <strong>@{telegramStatus.botUsername}</strong> · User ID <strong>{telegramStatus.telegramUserId}</strong></span>
            <button type="button" onClick={handleDisconnectTelegram} disabled={isSavingTelegram} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50">
              <Unplug className="h-4 w-4" aria-hidden="true" />
              <span>Putuskan</span>
            </button>
          </div>
        )}

        {!isSupabaseConfigured() && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-900">
            Bot Telegram memerlukan koneksi Supabase dan Edge Functions. Personalisasi tetap bisa disimpan lokal untuk pratinjau.
          </div>
        )}
        {telegramFeedback && (
          <div role={telegramFeedback.type === 'error' ? 'alert' : 'status'} className={`mb-4 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${telegramFeedback.type === 'success' ? 'border-lumut/25 bg-lumut/10 text-coklat-tua' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {telegramFeedback.type === 'success' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{telegramFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveTelegram} className="space-y-4">
          <div>
            <label htmlFor="telegram-bot-token" className="field-label">Token bot</label>
            <input
              id="telegram-bot-token"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              required={!telegramStatus.configured}
              value={telegramToken}
              onChange={(event) => setTelegramToken(event.target.value)}
              placeholder={telegramStatus.configured ? 'Kosongkan untuk memakai token yang tersimpan' : 'Token dari BotFather'}
              disabled={!isSupabaseConfigured() || isTelegramLoading || isSavingTelegram}
              className="field-control px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1.5 text-[13px] leading-relaxed text-coklat-sedang">Token tidak ditampilkan lagi. Kosongkan kolom ini untuk memakai token tersimpan.</p>
          </div>
          <div>
            <label htmlFor="telegram-user-id" className="field-label">User ID Telegram yang diizinkan</label>
            <input
              id="telegram-user-id"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{1,20}"
              required
              value={telegramUserId}
              onChange={(event) => setTelegramUserId(event.target.value.replace(/\D/g, '').slice(0, 20))}
              placeholder="Contoh: 123456789"
              disabled={!isSupabaseConfigured() || isTelegramLoading || isSavingTelegram}
              className="field-control px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1.5 text-[13px] leading-relaxed text-coklat-sedang">Hanya akun Telegram ini yang bisa menerbitkan utas dan balasan lewat bot.</p>
          </div>

          <div className="rounded-xl border border-garis/80 bg-krem/55 p-3.5 text-sm leading-relaxed text-coklat-sedang">
            <p className="font-semibold text-coklat-tua">Perintah bot</p>
            <p className="mt-1"><code className="font-semibold text-coklat-tua">/thread</code> lalu kirim isi utas saat diminta.</p>
            <p><code className="font-semibold text-coklat-tua">/reply</code> lalu kirim ID 6 karakter dan isi balasan.</p>
            <p><code className="font-semibold text-coklat-tua">/list</code> lalu pilih nomor halaman.</p>
            <p><code className="font-semibold text-coklat-tua">/delete</code> lalu kirim ID 6 karakter dan konfirmasi hapus.</p>
            <p><code className="font-semibold text-coklat-tua">/cancel</code> atau tombol Keluar untuk membatalkan langkah.</p>
          </div>

          <div className="flex justify-end border-t border-garis/80 pt-4">
            <button type="submit" disabled={!isSupabaseConfigured() || isTelegramLoading || isSavingTelegram} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-coklat-tua px-4 text-sm font-semibold text-kertas transition-colors hover:bg-lumut disabled:cursor-wait disabled:opacity-60">
              {isSavingTelegram || isTelegramLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
              <span>{isTelegramLoading ? 'Memeriksa bot…' : isSavingTelegram ? 'Menghubungkan…' : 'Simpan & hubungkan bot'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};


