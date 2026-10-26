import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Edit,
  Trash2,
  Pin,
  ExternalLink,
  BookOpen,
  MessageSquareQuote,
  CheckCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Entry, ThreadPost } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entries' | 'threads'>('entries');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'entry' | 'thread';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, threadsRes] = await Promise.all([
        dataService.getEntries({ limit: 100, status: undefined }), // get both draft & published
        dataService.getThreads({ status: undefined }),
      ]);
      setEntries(entriesRes.entries);
      setThreads(threadsRes);
    } catch (err) {
      console.error('Gagal memuat data dashboard admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePinEntry = async (id: string, currentPin: boolean) => {
    try {
      await dataService.togglePinEntry(id, !currentPin);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_pinned: !currentPin } : e))
      );
    } catch (err) {
      alert('Gagal mengubah status pin entri: ' + err);
    }
  };

  const handleTogglePinThread = async (id: string, currentPin: boolean) => {
    try {
      await dataService.togglePinThread(id, !currentPin);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_pinned: !currentPin } : t))
      );
    } catch (err) {
      alert('Gagal mengubah status pin utas: ' + err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      if (deleteTarget.type === 'entry') {
        await dataService.deleteEntry(deleteTarget.id);
        setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      } else {
        await dataService.deleteThread(deleteTarget.id);
        setThreads((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      alert('Gagal menghapus item: ' + err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const publishedEntriesCount = entries.filter((e) => e.status === 'published').length;
  const draftEntriesCount = entries.filter((e) => e.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-garis/80 pb-6">
        <div>
          <span className="font-elite text-xs uppercase tracking-widest text-terracotta">
            Pusat Pengelolaan Konten
          </span>
          <h1 className="font-playfair text-3xl font-bold text-coklat-tua">
            Meja Kerja Pengelola
          </h1>
          <p className="font-lora text-sm text-coklat-sedang mt-1">
            Kelola tulisan buku harian, status publikasi, dan utas pemikiran.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/entri/baru"
            className="px-4 py-2.5 rounded-xl bg-coklat-tua hover:bg-coklat-sedang text-kertas font-lora text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4 text-[#D9C7A3]" />
            <span>Tulis Lembar Baru</span>
          </Link>

          <Link
            to="/admin/utas"
            className="px-4 py-2.5 rounded-xl bg-kertas hover:bg-garis/30 text-coklat-tua border border-garis font-lora text-sm font-medium transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
          >
            <MessageSquareQuote className="w-4 h-4 text-terracotta" />
            <span>Tulis Utas</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="paper-card rounded-xl p-4 border border-garis">
          <span className="font-elite text-xs text-coklat-sedang uppercase">Total Lembar</span>
          <p className="font-playfair text-2xl sm:text-3xl font-bold text-coklat-tua mt-1">
            {entries.length}
          </p>
        </div>

        <div className="paper-card rounded-xl p-4 border border-garis">
          <span className="font-elite text-xs text-green-700 uppercase">Diterbitkan</span>
          <p className="font-playfair text-2xl sm:text-3xl font-bold text-green-800 mt-1">
            {publishedEntriesCount}
          </p>
        </div>

        <div className="paper-card rounded-xl p-4 border border-garis">
          <span className="font-elite text-xs text-amber-700 uppercase">Draf Tersimpan</span>
          <p className="font-playfair text-2xl sm:text-3xl font-bold text-amber-800 mt-1">
            {draftEntriesCount}
          </p>
        </div>

        <div className="paper-card rounded-xl p-4 border border-garis">
          <span className="font-elite text-xs text-terracotta uppercase">Total Utas</span>
          <p className="font-playfair text-2xl sm:text-3xl font-bold text-terracotta mt-1">
            {threads.length}
          </p>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex border-b border-garis gap-2">
        <button
          onClick={() => setActiveTab('entries')}
          className={`pb-3 px-4 font-lora text-sm font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'entries'
              ? 'border-coklat-tua text-coklat-tua font-semibold'
              : 'border-transparent text-coklat-sedang hover:text-coklat-tua'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lembaran Buku ({entries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('threads')}
          className={`pb-3 px-4 font-lora text-sm font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'threads'
              ? 'border-coklat-tua text-coklat-tua font-semibold'
              : 'border-transparent text-coklat-sedang hover:text-coklat-tua'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>Utas Senja ({threads.length})</span>
        </button>
      </div>

      {/* ENTRIES TAB CONTENT */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="paper-card h-16 rounded-lg bg-garis/20" />
              ))}
            </div>
          ) : entries.length > 0 ? (
            <div className="paper-card rounded-xl border border-garis overflow-hidden divide-y divide-garis/60">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-krem/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status badge */}
                      {entry.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-elite px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Terbit</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-elite px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <FileText className="w-3 h-3" />
                          <span>Draf</span>
                        </span>
                      )}

                      {/* Pin status badge */}
                      {entry.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-elite px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
                          <Pin className="w-3 h-3 fill-terracotta" />
                          <span>Pin</span>
                        </span>
                      )}

                      {entry.mood && (
                        <span className="font-caveat text-xs px-2 py-0.5 rounded-full bg-garis/30 text-coklat-tua">
                          {entry.mood}
                        </span>
                      )}

                      <span className="text-xs font-elite text-coklat-sedang">
                        {entry.entry_date}
                      </span>
                    </div>

                    <h3 className="font-playfair text-lg font-bold text-coklat-tua truncate">
                      {entry.title}
                    </h3>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePinEntry(entry.id, entry.is_pinned)}
                      title={entry.is_pinned ? 'Lepas Sematan (Unpin)' : 'Sematkan di Atas (Pin)'}
                      className={`p-2 rounded-lg border text-xs font-lora transition-colors cursor-pointer ${
                        entry.is_pinned
                          ? 'bg-terracotta text-krem border-terracotta'
                          : 'bg-kertas hover:bg-garis/40 text-coklat-sedang border-garis'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${entry.is_pinned ? 'fill-current' : ''}`} />
                    </button>

                    <Link
                      to={`/buku/${entry.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Lihat Halaman Publik"
                      className="p-2 rounded-lg bg-kertas hover:bg-garis/40 text-coklat-sedang border border-garis transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <Link
                      to={`/admin/entri/${entry.id}`}
                      title="Ubah / Edit Entri"
                      className="p-2 rounded-lg bg-kertas hover:bg-garis/40 text-coklat-tua border border-garis transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4 text-terracotta" />
                      <span className="text-xs font-lora hidden sm:inline">Ubah</span>
                    </Link>

                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'entry',
                          id: entry.id,
                          title: entry.title,
                        })
                      }
                      title="Hapus Entri Ini"
                      className="p-2 rounded-lg bg-kertas hover:bg-red-50 text-red-700 border border-garis hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="paper-sheet rounded-xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-coklat-sedang/50 mx-auto" />
              <h3 className="font-playfair text-xl font-bold text-coklat-tua">
                Belum Ada Lembaran Buku
              </h3>
              <p className="font-lora text-sm text-coklat-sedang">
                Mulailah menuliskan catatan hening pertama Anda untuk pengunjung.
              </p>
              <Link
                to="/admin/entri/baru"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coklat-tua text-kertas text-sm font-lora hover:bg-coklat-sedang transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tulis Lembar Pertama</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* THREADS TAB CONTENT */}
      {activeTab === 'threads' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="paper-card h-20 rounded-lg bg-garis/20" />
              ))}
            </div>
          ) : threads.length > 0 ? (
            <div className="paper-card rounded-xl border border-garis overflow-hidden divide-y divide-garis/60">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-krem/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {thread.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-elite px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/20">
                          <Pin className="w-3 h-3 fill-terracotta" />
                          <span>Pin</span>
                        </span>
                      )}
                      <span className="text-xs font-elite text-coklat-sedang">
                        {new Date(thread.created_at).toLocaleString('id-ID')}
                      </span>
                      {thread.replies && thread.replies.length > 0 && (
                        <span className="text-xs font-lora text-terracotta">
                          • {thread.replies.length} balasan bersambung
                        </span>
                      )}
                    </div>

                    <p className="font-lora text-sm text-coklat-tua line-clamp-2">
                      {thread.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePinThread(thread.id, thread.is_pinned)}
                      title={thread.is_pinned ? 'Lepas Sematan (Unpin)' : 'Sematkan (Pin)'}
                      className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                        thread.is_pinned
                          ? 'bg-terracotta text-krem border-terracotta'
                          : 'bg-kertas hover:bg-garis/40 text-coklat-sedang border-garis'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${thread.is_pinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'thread',
                          id: thread.id,
                          title: thread.content.slice(0, 40) + '...',
                        })
                      }
                      title="Hapus Utas Ini"
                      className="p-2 rounded-lg bg-kertas hover:bg-red-50 text-red-700 border border-garis hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="paper-sheet rounded-xl p-12 text-center space-y-3">
              <MessageSquareQuote className="w-10 h-10 text-coklat-sedang/50 mx-auto" />
              <h3 className="font-playfair text-xl font-bold text-coklat-tua">
                Belum Ada Utas Tersimpan
              </h3>
              <p className="font-lora text-sm text-coklat-sedang">
                Tuliskan penggalan pemikiran atau renungan pendek dalam bentuk utas.
              </p>
              <Link
                to="/admin/utas"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coklat-tua text-kertas text-sm font-lora hover:bg-coklat-sedang transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tulis Utas Baru</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="paper-card rounded-2xl p-6 max-w-md w-full border border-garis shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <h3 className="font-playfair text-xl font-bold text-coklat-tua">
                Konfirmasi Penghapusan
              </h3>
            </div>

            <p className="font-lora text-sm text-coklat-tua/90">
              Apakah Anda yakin ingin menghapus{' '}
              <strong className="font-semibold text-coklat-tua">
                "{deleteTarget.title}"
              </strong>
              ? Tindakan ini permanen dan tidak dapat dipulihkan kembali.
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-kertas hover:bg-garis/30 text-coklat-tua border border-garis text-sm font-lora cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-lora shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
