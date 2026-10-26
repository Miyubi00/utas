import React, { useEffect, useMemo, useState } from 'react';
import { CalendarX, CheckCircle, CornerDownRight, Feather, ImagePlus, MessageSquareQuote, Pin, Plus, RefreshCw, Send, Trash2, Upload, X } from 'lucide-react';
import { DateBar, formatIndonesianDate } from '../../components/DateBar';
import { ThreadCard } from '../../components/ThreadCard';
import { dataService } from '../../lib/dataService';
import { useSiteSettings } from '../../lib/siteSettingsContext';
import { ThreadPost, EntryStatus } from '../../types';

type ComposerTarget = { type: 'new' } | { type: 'reply'; threadId: string } | null;

export const AdminThreads: React.FC = () => {
  const { authorHandle } = useSiteSettings();
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [composerTarget, setComposerTarget] = useState<ComposerTarget>(null);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadThreads = async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
      setIsRefreshing(true);
    }
    setLoadError(null);
    try {
      setThreads(await dataService.getThreads({ status: undefined }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Gagal memuat utas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { void loadThreads(true); }, []);

  const filteredThreads = useMemo(() => {
    if (!selectedDate) return threads;
    return threads.filter((thread) => {
      const date = new Date(thread.created_at);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return dateKey === selectedDate;
    });
  }, [threads, selectedDate]);

  const clearComposer = () => {
    setContent('');
    setImageUrl('');
    setIsPinned(false);
  };

  const closeComposer = () => {
    if ((content.trim() || imageUrl.trim()) && !window.confirm('Bu catatan belum disimpan. Tutup tanpa menyimpan?')) return;
    clearComposer();
    setComposerTarget(null);
    setErrorMsg(null);
  };

  const startNewThread = () => {
    if (composerTarget && (content.trim() || imageUrl.trim()) && !window.confirm('Buang isi yang belum disimpan dan mulai utas baru?')) return;
    clearComposer();
    setErrorMsg(null);
    setComposerTarget({ type: 'new' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const connectReply = (thread: ThreadPost) => {
    if (composerTarget && (content.trim() || imageUrl.trim()) && !window.confirm('Buang isi yang belum disimpan dan mulai balasan?')) return;
    clearComposer();
    setErrorMsg(null);
    setComposerTarget({ type: 'reply', threadId: thread.id });
    window.setTimeout(() => {
      document.getElementById(`reply-composer-${thread.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => document.getElementById(`reply-content-${thread.id}`)?.focus(), 250);
    }, 50);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      setImageUrl(await dataService.uploadImage(file));
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const isReply = composerTarget?.type === 'reply';
    const status: EntryStatus = isReply || submitter?.value !== 'draft' ? 'published' : 'draft';

    if (!content.trim()) {
      setErrorMsg('Isi utas terlebih dahulu.');
      document.getElementById(isReply && composerTarget ? `reply-content-${composerTarget.threadId}` : 'thread-content')?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await dataService.saveThread({
        content: content.trim(),
        parent_id: composerTarget?.type === 'reply' ? composerTarget.threadId : null,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        status,
        is_pinned: isPinned,
      });
      clearComposer();
      setComposerTarget(null);
      if (!isReply) setSelectedDate(null);
      setSuccessNotice(isReply ? 'Balasan berhasil dikirim.' : status === 'published' ? 'Utas berhasil diterbitkan.' : 'Draf berhasil disimpan.');
      window.setTimeout(() => setSuccessNotice(null), 3500);
      await loadThreads();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal menyimpan utas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      await dataService.togglePinThread(id, !currentPin);
      setThreads((previous) => previous.map((thread) => thread.id === id ? { ...thread, is_pinned: !currentPin } : thread));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal mengubah sematan.');
    }
  };

  const handleDelete = async (thread: ThreadPost) => {
    if (!window.confirm('Hapus utas ini beserta balasan yang tersambung?')) return;
    try {
      await dataService.deleteThread(thread.id);
      setThreads((previous) => previous.filter((item) => item.id !== thread.id));
      setSuccessNotice('Utas berhasil dihapus.');
      window.setTimeout(() => setSuccessNotice(null), 3500);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Gagal menghapus utas.');
    }
  };

  const isNewComposerOpen = composerTarget?.type === 'new';
  const replyingToId = composerTarget?.type === 'reply' ? composerTarget.threadId : null;
  const composer = isNewComposerOpen ? (
    <section
      id="new-thread-composer"
      className="paper-card rounded-2xl p-4 shadow-journal sm:p-6"
      aria-labelledby="compose-title"
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-garis/80 pb-4">
        <div>
          <h2 id="compose-title" className="font-playfair text-xl font-semibold text-coklat-tua sm:text-2xl">
            Buat utas baru
          </h2>
        </div>
        <button type="button" onClick={closeComposer} aria-label="Tutup formulir" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-coklat-sedang transition-colors hover:bg-krem hover:text-coklat-tua">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="thread-content" className="field-label">Isi utas</label>
          <textarea
            id="thread-content"
            name="content"
            autoComplete="off"
            required
            rows={5}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Mulai menulis di sini…"
            className="field-control min-h-36 resize-y px-4 py-3.5 font-reading text-base leading-relaxed sm:text-lg"
          />
        </div>

        <div>
          <label htmlFor="thread-image-url" className="field-label">Foto <span className="font-normal text-coklat-sedang">(opsional)</span></label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="thread-image-url"
              name="image_url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Tempel tautan gambar…"
              className="field-control min-w-0 flex-1 px-3.5 py-3"
            />
            <input id="thread-image-file" name="image_file" type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
            <label htmlFor="thread-image-file" className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-garis bg-krem px-4 text-sm font-semibold text-coklat-tua transition-colors hover:bg-lumut/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lumut">
              {isUploading ? <Upload className="h-4 w-4 animate-pulse text-lumut" aria-hidden="true" /> : <ImagePlus className="h-4 w-4 text-lumut" aria-hidden="true" />}
              <span>{isUploading ? 'Mengunggah…' : 'Pilih foto'}</span>
            </label>
          </div>
          {imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border border-garis bg-krem">
              <img src={imageUrl} alt="Pratinjau foto utas" width="640" height="360" className="max-h-52 w-full object-cover" />
            </div>
          )}
        </div>

        <label className="flex min-h-11 items-center gap-2.5 rounded-xl border border-garis/80 bg-krem/60 px-3.5 text-sm font-medium text-coklat-tua">
          <input type="checkbox" name="is_pinned" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} className="h-4 w-4 accent-[#5D715B]" />
          <Pin className="h-4 w-4 text-lumut" aria-hidden="true" />
          <span>Sematkan di atas</span>
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="submit" name="status" value="published" disabled={isSubmitting || isUploading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coklat-tua px-4 text-base font-semibold text-kertas transition-colors hover:bg-lumut disabled:cursor-wait disabled:opacity-60">
            <Send className="h-4 w-4 text-[#DCE4D6]" aria-hidden="true" />
            <span>{isSubmitting ? 'Menyimpan…' : 'Terbitkan utas'}</span>
          </button>
          <button type="submit" name="status" value="draft" disabled={isSubmitting || isUploading} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-garis bg-kertas px-4 text-base font-semibold text-coklat-tua transition-colors hover:bg-krem disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? 'Menyimpan…' : 'Simpan draf'}
          </button>
        </div>
      </form>
    </section>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-playfair text-xl font-semibold text-coklat-tua sm:text-2xl">Lini masa</h1>
        <button
          type="button"
          onClick={isNewComposerOpen ? closeComposer : startNewThread}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-coklat-tua px-4 text-sm font-semibold text-kertas transition-colors hover:bg-lumut"
        >
          {isNewComposerOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          <span>{isNewComposerOpen ? 'Tutup' : 'Utas baru'}</span>
        </button>
      </div>

      {successNotice && (
        <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-xl border border-lumut/25 bg-lumut/10 px-4 py-3 text-sm font-medium text-coklat-tua">
          <CheckCircle className="h-4 w-4 shrink-0 text-lumut" aria-hidden="true" />
          <span>{successNotice}</span>
        </div>
      )}
      {errorMsg && !replyingToId && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
          {errorMsg}
        </div>
      )}

      {isNewComposerOpen && composer}

      <DateBar threads={threads} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-garis px-1 pb-3 text-[13px] leading-relaxed text-coklat-sedang sm:text-sm">
        {filteredThreads.length > 0 && (
          <span className="min-w-0 flex-1" aria-live="polite">
            {selectedDate ? (
              <>Menampilkan <strong className="font-semibold text-coklat-tua">{filteredThreads.length} utas</strong> pada {formatIndonesianDate(selectedDate)}</>
            ) : (
              <>Semua utas <span className="mx-1 text-garis" aria-hidden="true">·</span> {threads.length}</>
            )}
          </span>
        )}
        <button type="button" onClick={() => void loadThreads(true)} disabled={isRefreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-lumut transition-colors hover:bg-lumut/10 disabled:cursor-wait disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isRefreshing ? 'Memuat…' : 'Segarkan'}</span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          <span>Utas gagal dimuat. Periksa koneksi, lalu coba lagi.</span>
          <button type="button" onClick={() => void loadThreads(true)} className="min-h-9 rounded-lg px-3 font-semibold underline underline-offset-2">Coba lagi</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4" aria-label="Memuat utas" aria-busy="true">
          {[1, 2, 3].map((item) => <div key={item} className="paper-card h-36 animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredThreads.length > 0 ? (
        <div className="space-y-4 sm:space-y-5">
          {filteredThreads.map((thread) => {
            const replyComposer = replyingToId === thread.id ? (
              <form
                id={`reply-composer-${thread.id}`}
                onSubmit={handleSubmit}
                className="border-l-2 border-lumut/30 pl-3 sm:pl-4"
                aria-label={`Balas utas dari ${authorHandle}`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-garis bg-krem text-lumut">
                    <Feather className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label htmlFor={`reply-content-${thread.id}`} className="font-playfair text-[15px] font-semibold text-coklat-tua">
                        Balas {authorHandle}
                      </label>
                      <button type="button" onClick={closeComposer} aria-label="Tutup balasan" title="Tutup balasan" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-coklat-sedang transition-colors hover:bg-krem hover:text-coklat-tua">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <textarea
                      id={`reply-content-${thread.id}`}
                      name="reply_content"
                      autoComplete="off"
                      required
                      rows={3}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Tulis balasan…"
                      className="field-control min-h-24 resize-y px-3.5 py-3 font-reading text-base leading-relaxed"
                    />
                    {imageUrl && (
                      <div className="relative mt-3 w-fit max-w-full overflow-hidden rounded-2xl border border-garis bg-krem">
                        <img src={imageUrl} alt="Pratinjau foto balasan" width="640" height="480" className="max-h-72 max-w-full object-contain" />
                        <button type="button" onClick={() => setImageUrl('')} aria-label="Hapus foto dari balasan" title="Hapus foto" className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-coklat-tua/75 text-kertas shadow-sm transition-colors hover:bg-coklat-tua">
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                    {errorMsg && <p role="alert" className="mt-1.5 text-sm text-red-700">{errorMsg}</p>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <input id={`reply-image-${thread.id}`} name={`reply_image_${thread.id}`} type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} className="sr-only" />
                    <label htmlFor={`reply-image-${thread.id}`} title="Unggah foto" aria-label="Unggah foto untuk balasan" className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-coklat-sedang transition-colors hover:bg-krem hover:text-lumut ${isUploading ? 'cursor-wait opacity-60' : ''}`}>
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{isUploading ? 'Mengunggah foto…' : 'Unggah foto'}</span>
                    </label>
                  </div>
                  <div className="ml-auto flex justify-end gap-2">
                    <button type="button" onClick={closeComposer} className="min-h-10 rounded-lg px-3 text-sm font-medium text-coklat-sedang transition-colors hover:bg-krem">Batal</button>
                    <button type="submit" name="status" value="published" disabled={isSubmitting || isUploading} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-coklat-tua px-4 text-sm font-semibold text-kertas transition-colors hover:bg-lumut disabled:cursor-wait disabled:opacity-60">
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isSubmitting ? 'Mengirim…' : 'Balas'}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : null;

            return (
              <ThreadCard
                key={thread.id}
                post={thread}
                replyComposer={replyComposer}
                showPinnedBadge={false}
                headerAction={(
                  <button
                    type="button"
                    onClick={() => void handleTogglePin(thread.id, thread.is_pinned)}
                    aria-label={thread.is_pinned ? 'Lepas sematan utas' : 'Sematkan utas'}
                    aria-pressed={thread.is_pinned}
                    title={thread.is_pinned ? 'Lepas sematan' : 'Sematkan'}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${thread.is_pinned ? 'border-lumut/25 bg-lumut/10 text-lumut' : 'border-garis text-coklat-sedang hover:bg-krem hover:text-lumut'}`}
                  >
                    <Pin className={`h-4 w-4 ${thread.is_pinned ? 'fill-current' : ''}`} aria-hidden="true" />
                  </button>
                )}
                footer={(
                  <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => connectReply(thread)} aria-label="Balas utas ini" title="Balas utas ini" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-lumut transition-colors hover:bg-lumut/10">
                        <CornerDownRight className="h-4 w-4" aria-hidden="true" />
                        <span>Balas</span>
                      </button>
                      <button type="button" onClick={() => void handleDelete(thread)} aria-label="Hapus utas ini" title="Hapus utas ini" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Hapus</span>
                      </button>
                  </div>
                )}
              />
            );
          })}
        </div>
      ) : selectedDate ? (
        <div className="paper-sheet rounded-2xl px-5 py-10 text-center sm:px-10 sm:py-12">
          <CalendarX className="mx-auto h-9 w-9 text-lumut/70" aria-hidden="true" />
          <h2 className="mt-4 font-playfair text-xl font-semibold text-coklat-tua sm:text-2xl">Belum ada utas pada {formatIndonesianDate(selectedDate)}</h2>
          <button type="button" onClick={() => setSelectedDate(null)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-coklat-tua px-5 text-sm font-semibold text-kertas transition-colors hover:bg-lumut">Tampilkan semua utas</button>
        </div>
      ) : (
        <div className="paper-sheet rounded-2xl px-5 py-12 text-center sm:px-10 sm:py-16">
          <MessageSquareQuote className="mx-auto h-9 w-9 text-lumut/70" aria-hidden="true" />
          <h2 className="mt-4 font-playfair text-2xl font-semibold text-coklat-tua">Belum ada utas</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-coklat-sedang sm:text-base">Buat utas pertama dari tombol “Utas baru”.</p>
        </div>
      )}
    </div>
  );
};
