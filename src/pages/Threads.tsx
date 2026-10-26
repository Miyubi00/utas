import React, { useEffect, useState, useMemo } from 'react';
import { MessageSquareQuote, RefreshCw, CalendarX } from 'lucide-react';
import { ThreadCard } from '../components/ThreadCard';
import { DateBar, formatIndonesianDate } from '../components/DateBar';
import { dataService } from '../lib/dataService';
import { ThreadPost } from '../types';
import { useSiteSettings } from '../lib/siteSettingsContext';

export const Threads: React.FC = () => {
  const { settings } = useSiteSettings();
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadThreads = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await dataService.getThreads({ status: 'published' });
      setThreads(data);
    } catch (err) {
      console.error('Gagal memuat utas:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const filteredThreads = useMemo(() => {
    if (!selectedDate) return threads;

    return threads.filter((thread) => {
      try {
        const date = new Date(thread.created_at);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return dateKey === selectedDate;
      } catch {
        return false;
      }
    });
  }, [threads, selectedDate]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="space-y-5 sm:space-y-6">
        <h1 className="sr-only">Lini masa catatan {settings.site_name}</h1>
        <DateBar
          threads={threads}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-garis px-1 pb-3 text-xs leading-relaxed text-coklat-sedang sm:text-sm">
          {filteredThreads.length > 0 && (
            <span className="min-w-0 flex-1" aria-live="polite">
              {selectedDate ? (
                <>Menampilkan <strong className="font-semibold text-coklat-tua">{filteredThreads.length} utas</strong> pada {formatIndonesianDate(selectedDate)}</>
              ) : (
                <>Semua catatan <span className="mx-1 text-garis" aria-hidden="true">·</span> {threads.length} utas</>
              )}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadThreads(true)}
            disabled={isRefreshing}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium text-lumut transition-colors hover:bg-lumut/10 disabled:cursor-wait disabled:opacity-60 sm:text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isRefreshing ? 'Memuat…' : 'Segarkan'}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-label="Memuat catatan" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div key={item} className="paper-card h-36 animate-pulse rounded-2xl bg-kertas/80" />
            ))}
          </div>
        ) : filteredThreads.length > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            {filteredThreads.map((post) => <ThreadCard key={post.id} post={post} />)}
          </div>
        ) : selectedDate ? (
          <div className="paper-sheet rounded-2xl px-5 py-10 text-center sm:px-10 sm:py-12">
            <CalendarX className="mx-auto h-9 w-9 text-lumut/70" aria-hidden="true" />
            <h2 className="mt-4 font-playfair text-xl font-semibold text-coklat-tua sm:text-2xl">
              Belum ada catatan pada {formatIndonesianDate(selectedDate)}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-coklat-sedang sm:text-base">
              Pilih tanggal lain untuk membaca catatan yang tersimpan.
            </p>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-coklat-tua px-5 text-sm font-semibold text-kertas transition-colors hover:bg-lumut"
            >
              Tampilkan semua catatan
            </button>
          </div>
        ) : (
          <div className="paper-sheet rounded-2xl px-5 py-12 text-center sm:px-10 sm:py-16">
            <MessageSquareQuote className="mx-auto h-9 w-9 text-lumut/70" aria-hidden="true" />
            <h2 className="mt-4 font-playfair text-xl font-semibold text-coklat-tua sm:text-2xl">Belum ada utas</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-coklat-sedang sm:text-base">
              Catatan pertama akan muncul di sini saat sudah diterbitkan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
