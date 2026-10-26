import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MessageSquareQuote, ArrowRight, Sparkles, Feather } from 'lucide-react';
import { BookHero } from '../components/BookHero';
import { EntryCard } from '../components/EntryCard';
import { ThreadCard } from '../components/ThreadCard';
import { dataService } from '../lib/dataService';
import { Entry, ThreadPost } from '../types';
import { AUTHOR } from '../config/site';
import { useSiteSettings } from '../lib/siteSettingsContext';

export const Home: React.FC = () => {
  const { settings, authorHandle } = useSiteSettings();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pinnedEntries, setPinnedEntries] = useState<Entry[]>([]);
  const [recentThreads, setRecentThreads] = useState<ThreadPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [entriesRes, threadsRes] = await Promise.all([
          dataService.getEntries({ limit: 6, status: 'published' }),
          dataService.getThreads({ status: 'published' }),
        ]);

        if (isMounted) {
          const all = entriesRes.entries;
          setPinnedEntries(all.filter((e) => e.is_pinned));
          setEntries(all.filter((e) => !e.is_pinned).slice(0, 4));
          setRecentThreads(threadsRes.slice(0, 2));
        }
      } catch (err) {
        console.error('Gagal memuat data beranda:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 3D Book Cover / Fallback */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="w-full max-w-sm">
              <BookHero />
            </div>
          </div>

          {/* Right Column: Title, Intro & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-garis/30 text-coklat-sedang font-elite text-xs tracking-wider border border-garis/60">
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span>JURNAL & UTAS REFLEKTIF</span>
            </div>

            <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-coklat-tua leading-[1.15]">
              {settings.site_name}
            </h1>

            <p className="font-lora text-lg sm:text-xl text-coklat-sedang max-w-xl leading-relaxed mx-auto lg:mx-0">
              {settings.tagline}
            </p>

            <blockquote className="font-caveat text-xl sm:text-2xl text-coklat-tua/90 border-l-2 border-terracotta pl-4 py-1 italic max-w-lg mx-auto lg:mx-0">
              "Kutuliskan apa yang luput dari bising siang, tersimpan hening di antara lembar-lembar petang."
            </blockquote>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                to="/buku"
                className="px-6 py-3 rounded-full bg-coklat-tua hover:bg-coklat-sedang text-kertas font-lora font-medium text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4 text-[#D9C7A3]" />
                <span>Buka Lembaran Buku</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/utas"
                className="px-6 py-3 rounded-full bg-kertas hover:bg-garis/40 text-coklat-tua border border-garis/80 font-lora font-medium text-base transition-colors duration-200 flex items-center gap-2 active:scale-[0.98]"
              >
                <MessageSquareQuote className="w-4 h-4 text-terracotta" />
                <span>Baca Utas Senja</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PINNED ENTRIES ("Lembar Pilihan") */}
      {pinnedEntries.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-garis/70 pb-3">
            <div>
              <span className="font-elite text-xs uppercase tracking-widest text-terracotta block">
                Pilihan Hati
              </span>
              <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-coklat-tua">
                Lembar yang Disematkan
              </h2>
            </div>
            <Link
              to="/buku"
              className="text-xs font-elite tracking-wider uppercase text-coklat-sedang hover:text-terracotta flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pinnedEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* LATEST ENTRIES ("Catatan Terkini") */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-garis/70 pb-3">
          <div>
            <span className="font-elite text-xs uppercase tracking-widest text-coklat-sedang block">
              Aliran Waktu
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-coklat-tua">
              Catatan Jurnal Terkini
            </h2>
          </div>
          <Link
            to="/buku"
            className="text-xs font-elite tracking-wider uppercase text-coklat-sedang hover:text-terracotta flex items-center gap-1 transition-colors"
          >
            <span>Buka Seluruh Buku</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="paper-card h-48 rounded-lg bg-garis/20" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="paper-sheet rounded-xl p-8 text-center text-coklat-sedang font-lora">
            Belum ada catatan yang diterbitkan saat ini.
          </div>
        )}
      </section>

      {/* UTAS / THREADS PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-garis/70 pb-3">
          <div>
            <span className="font-elite text-xs uppercase tracking-widest text-coklat-sedang block">
              Goresan Ringkas
            </span>
            <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-coklat-tua">
              Utas & Riak Pikiran
            </h2>
          </div>
          <Link
            to="/utas"
            className="text-xs font-elite tracking-wider uppercase text-coklat-sedang hover:text-terracotta flex items-center gap-1 transition-colors"
          >
            <span>Semua Utas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentThreads.map((thread) => (
            <ThreadCard key={thread.id} post={thread} />
          ))}
        </div>
      </section>

      {/* AUTHOR SIGNATURE CARD */}
      <section className="paper-sheet rounded-2xl p-6 sm:p-8 border border-garis text-center max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-garis/40 border border-garis mx-auto mb-3 flex items-center justify-center text-terracotta">
          <Feather className="w-5 h-5" />
        </div>
        <h3 className="font-playfair text-xl font-bold text-coklat-tua">{authorHandle}</h3>
        <p className="font-caveat text-xl text-coklat-sedang mt-1">{AUTHOR.bio}</p>
        <div className="mt-4 inline-flex items-center gap-2 text-xs font-elite text-coklat-sedang/80">
          <span>Tersimpan di</span>
          <span className="font-semibold text-coklat-tua">{AUTHOR.location}</span>
          <span>• Terbuka untuk dibaca siapa saja</span>
        </div>
      </section>
    </div>
  );
};
