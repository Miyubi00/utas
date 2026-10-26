import React, { useEffect, useState, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown } from 'lucide-react';
import { EntryCard } from '../components/EntryCard';
import { dataService } from '../lib/dataService';
import { Entry } from '../types';
import { POPULAR_TAGS } from '../config/site';

const PAGE_SIZE = 6;

export const BookList: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load initial entries when search or tag changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setOffset(0);

    async function loadData() {
      try {
        const { entries: data, total } = await dataService.getEntries({
          tag: selectedTag,
          search: searchQuery,
          limit: PAGE_SIZE,
          offset: 0,
          status: 'published',
        });

        if (isMounted) {
          setEntries(data);
          setTotalCount(total);
          setHasMore(data.length < total);
        }
      } catch (err) {
        console.error('Gagal memuat daftar entri:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(loadData, searchQuery ? 300 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedTag, searchQuery]);

  // Load more entries
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextOffset = offset + PAGE_SIZE;

    try {
      const { entries: nextBatch, total } = await dataService.getEntries({
        tag: selectedTag,
        search: searchQuery,
        limit: PAGE_SIZE,
        offset: nextOffset,
        status: 'published',
      });

      setEntries((prev) => [...prev, ...nextBatch]);
      setOffset(nextOffset);
      setTotalCount(total);
      setHasMore(entries.length + nextBatch.length < total);
    } catch (err) {
      console.error('Gagal memuat lebih banyak lembaran:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const tagList = useMemo(() => POPULAR_TAGS, []);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-elite text-xs uppercase tracking-widest text-terracotta">
          Koleksi Tulisan
        </span>
        <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold text-coklat-tua">
          Buku Catatan
        </h1>
        <p className="font-lora text-base sm:text-lg text-coklat-sedang">
          Setiap lembar adalah cerminan hari yang telah lampau, dirajut dari keheningan dan renungan sederhana.
        </p>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="paper-sheet rounded-xl p-4 sm:p-6 border border-garis shadow-xs space-y-4">
        {/* Search input */}
        <div className="relative">
          <label htmlFor="search-entries" className="sr-only">
            Cari judul atau penggalan isi lembar catatan
          </label>
          <Search className="w-4 h-4 text-coklat-sedang absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-entries"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau penggalan isi lembar catatan..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-kertas border border-garis/90 font-lora text-sm sm:text-base text-coklat-tua placeholder:text-coklat-sedang/70 focus:outline-none focus:ring-2 focus:ring-terracotta/50 focus:border-terracotta transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-coklat-sedang hover:text-coklat-tua p-1.5 focus-visible:outline-2 focus-visible:outline-terracotta rounded"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label="Filter berdasarkan topik">
          {tagList.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1 rounded-full text-xs sm:text-sm font-lora transition-all duration-150 border ${
                  isSelected
                    ? 'bg-coklat-tua text-krem border-coklat-tua shadow-xs font-medium'
                    : 'bg-kertas/80 text-coklat-sedang border-garis/80 hover:bg-garis/30 hover:text-coklat-tua'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count Info */}
      <div className="flex items-center justify-between text-xs font-elite text-coklat-sedang px-1">
        <span>Menampilkan {entries.length} dari {totalCount} lembar catatan</span>
        {selectedTag !== 'Semua' && (
          <span>Kategori: <strong className="text-terracotta">{selectedTag}</strong></span>
        )}
      </div>

      {/* Entries Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="paper-card h-56 rounded-lg bg-garis/20" />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="paper-sheet rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-coklat-sedang/50 mx-auto" />
          <h3 className="font-playfair text-xl font-bold text-coklat-tua">
            Tidak Ada Lembar Ditemukan
          </h3>
          <p className="font-lora text-sm text-coklat-sedang max-w-sm mx-auto">
            Tidak ditemukan catatan dengan kata kunci atau topik tersebut. Silakan coba pencarian lain.
          </p>
        </div>
      )}

      {/* "Muat Lagi" Button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-3 rounded-full bg-kertas hover:bg-garis/40 text-coklat-tua border border-garis font-lora text-sm sm:text-base font-medium transition-all shadow-xs flex items-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoadingMore ? 'Membuka Halaman Berikutnya...' : 'Muat Lebih Banyak Lembaran'}</span>
            <ChevronDown className={`w-4 h-4 text-terracotta ${isLoadingMore ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};
