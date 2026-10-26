import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Pin, BookOpen } from 'lucide-react';
import { MarkdownView } from '../components/MarkdownView';
import { PolaroidImage } from '../components/PolaroidImage';
import { dataService } from '../lib/dataService';
import { Entry } from '../types';
import { useSiteSettings } from '../lib/siteSettingsContext';

export const BookDetail: React.FC = () => {
  const { authorHandle } = useSiteSettings();
  const { slug } = useParams<{ slug: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    async function loadEntry() {
      if (!slug) return;
      setIsLoading(true);

      try {
        const data = await dataService.getEntryBySlug(slug);
        if (isMounted) {
          setEntry(data);
        }
      } catch (err) {
        console.error('Gagal mengambil detail entri:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="w-24 h-6 bg-garis/40 rounded" />
        <div className="w-3/4 h-10 bg-garis/50 rounded" />
        <div className="w-48 h-5 bg-garis/30 rounded" />
        <div className="h-64 bg-garis/20 rounded-xl mt-8" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <BookOpen className="w-12 h-12 text-coklat-sedang/50 mx-auto" />
        <h2 className="font-playfair text-2xl font-bold text-coklat-tua">
          Lembar Tidak Ditemukan
        </h2>
        <p className="font-lora text-coklat-sedang text-sm">
          Catatan yang Anda cari mungkin telah dipindahkan atau belum sempat dituliskan ke dalam buku ini.
        </p>
        <div className="pt-2">
          <Link
            to="/buku"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coklat-tua text-kertas font-lora text-sm hover:bg-coklat-sedang transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Buku Catatan</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(entry.entry_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/buku"
          className="inline-flex items-center gap-2 text-xs font-elite uppercase tracking-wider text-coklat-sedang hover:text-terracotta transition-colors group p-1"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Daftar Lembaran</span>
        </Link>
      </div>

      {/* Main Journal Page Card */}
      <div className="paper-sheet rounded-2xl p-6 sm:p-10 md:p-12 border border-garis shadow-journal-lg relative">
        {/* Book Binding Stitch accent on left */}
        <div className="hidden sm:block absolute left-4 top-8 bottom-8 w-px border-r border-dashed border-garis/80 pointer-events-none" />

        <div className="sm:pl-6 space-y-6">
          {/* Metadata: Date, Mood & Pin */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-garis/60 pb-4">
            <div className="flex items-center gap-2 text-sm text-coklat-sedang font-elite">
              <Calendar className="w-4 h-4 text-terracotta" />
              <time dateTime={entry.entry_date}>{formattedDate}</time>
            </div>

            <div className="flex items-center gap-2.5">
              {entry.mood && (
                <div className="font-caveat text-base font-semibold px-3 py-0.5 rounded-full bg-garis/40 text-coklat-tua border border-garis/70">
                  Suasana Hati: <span className="text-terracotta">{entry.mood}</span>
                </div>
              )}

              {entry.is_pinned && (
                <span
                  title="Lembar Disematkan"
                  className="flex items-center gap-1 text-xs font-elite uppercase text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full border border-terracotta/20"
                >
                  <Pin className="w-3 h-3 fill-terracotta" />
                  <span>Pin</span>
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-coklat-tua leading-[1.2]">
            {entry.title}
          </h1>

          {/* Author Byline */}
          <div className="flex items-center gap-2 text-xs font-lora text-coklat-sedang italic pb-2">
            <span>Oleh {authorHandle}</span>
            <span>•</span>
            <span>Waktu baca: ~3 menit</span>
          </div>

          {/* Cover Photo Polaroid Style */}
          {entry.cover_url && (
            <div className="my-8 flex justify-center">
              <PolaroidImage
                src={entry.cover_url}
                alt={entry.title}
                caption={entry.title}
                tiltDirection="right"
              />
            </div>
          )}

          {/* Content Body */}
          <div className="pt-2">
            <MarkdownView content={entry.content} />
          </div>

          {/* Tags Footer */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="pt-8 mt-10 border-t border-garis/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-elite text-coklat-sedang uppercase tracking-wider mr-1">
                Topik Lembar:
              </span>
              {entry.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs font-lora text-coklat-tua bg-krem px-2.5 py-1 rounded-md border border-garis/80"
                >
                  <Tag className="w-3 h-3 text-terracotta" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Journal Page End Stamp */}
          <div className="pt-8 text-center">
            <div className="inline-block px-4 py-1.5 rounded-full border border-garis/60 font-elite text-xs tracking-widest text-coklat-sedang/80 uppercase">
              • LEMBAR TERTUTUP •
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
