import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Eye, Edit3, CheckCircle } from 'lucide-react';
import { MarkdownView } from '../../components/MarkdownView';
import { PolaroidImage } from '../../components/PolaroidImage';
import { dataService } from '../../lib/dataService';
import { MOOD_OPTIONS, POPULAR_TAGS } from '../../config/site';
import { EntryStatus } from '../../types';

export const AdminEntryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Tenang');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Renungan']);
  const [coverUrl, setCoverUrl] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<EntryStatus>('published');
  const [isPinned, setIsPinned] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing) {
      setSlug(generateSlug(val));
    }
  };

  // Load existing entry if editing
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadEntry() {
      setIsLoading(true);
      try {
        const found = await dataService.getEntryById(id!);
        if (found && isMounted) {
          setTitle(found.title);
          setSlug(found.slug);
          setContent(found.content);
          setMood(found.mood || 'Tenang');
          setTags(found.tags || []);
          setCoverUrl(found.cover_url || '');
          setEntryDate(found.entry_date);
          setStatus(found.status);
          setIsPinned(found.is_pinned);
        }
      } catch (err) {
        console.error('Gagal memuat entri:', err);
        setErrorMsg('Gagal memuat data lembar catatan.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Handle image file upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const uploadedUrl = await dataService.uploadImage(file);
      setCoverUrl(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar';
      setErrorMsg('Gagal mengunggah gambar: ' + msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Tag helper
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Judul dan isi catatan wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await dataService.saveEntry({
        id: id,
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        content,
        mood,
        tags,
        cover_url: coverUrl.trim() || null,
        entry_date: entryDate,
        status,
        is_pinned: isPinned,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat menyimpan';
      setErrorMsg('Gagal menyimpan: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-terracotta border-t-transparent animate-spin mx-auto" />
        <p className="font-lora text-coklat-sedang text-sm">Membuka lembar catatan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-elite uppercase tracking-wider text-coklat-sedang hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-elite text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-300">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Tersimpan dengan rapi! Mengalihkan...</span>
          </div>
        )}
      </div>

      <div className="paper-card rounded-2xl p-6 sm:p-8 border border-garis shadow-journal-lg space-y-6">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-coklat-tua">
            {isEditing ? 'Sunting Lembar Catatan' : 'Tulis Lembaran Senja Baru'}
          </h1>
          <p className="font-lora text-xs sm:text-sm text-coklat-sedang mt-1">
            Goreskan kata dengan ketulusan; setiap tanda baca memiliki ruangnya sendiri.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-lora text-red-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="entry-title" className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
                Judul Catatan
              </label>
              <input
                id="entry-title"
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="Contoh: Secangkir Kopi dan Rinai Hujan..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-kertas border border-garis font-playfair font-semibold text-lg text-coklat-tua placeholder:text-coklat-sedang/50 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="entry-slug" className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
                Slug URL
              </label>
              <input
                id="entry-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="secangkir-kopi..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-kertas border border-garis font-elite text-xs text-coklat-tua placeholder:text-coklat-sedang/50 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta"
              />
            </div>
          </div>

          {/* Date, Mood, Status, Pin Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            {/* Entry Date */}
            <div className="space-y-1.5">
              <label htmlFor="entry-date" className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
                Tanggal Jurnal
              </label>
              <input
                id="entry-date"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-kertas border border-garis font-elite text-xs text-coklat-tua focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </div>

            {/* Mood */}
            <div className="space-y-1.5">
              <label htmlFor="entry-mood" className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
                Suasana Hati (Mood)
              </label>
              <select
                id="entry-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-kertas border border-garis font-lora text-xs text-coklat-tua focus:outline-none focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
              >
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label htmlFor="entry-status" className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
                Status Lembar
              </label>
              <select
                id="entry-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EntryStatus)}
                className="w-full px-3 py-2 rounded-lg bg-kertas border border-garis font-lora text-xs text-coklat-tua focus:outline-none focus:ring-2 focus:ring-terracotta/40 cursor-pointer"
              >
                <option value="published">Diterbitkan (Terbuka)</option>
                <option value="draft">Draf Pribadi (Tersimpan)</option>
              </select>
            </div>

            {/* Is Pinned */}
            <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-terracotta accent-terracotta rounded"
                />
                <span className="font-lora text-xs text-coklat-tua font-medium">
                  Sematkan di Atas (Pin)
                </span>
              </label>
            </div>
          </div>

          {/* Cover Image Upload & URL */}
          <div className="space-y-2 p-4 rounded-xl bg-krem/40 border border-garis">
            <label className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
              Gambar Sampul / Foto Jurnal
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Tautkan tautan gambar atau unggah file di samping..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-kertas border border-garis font-lora text-xs text-coklat-tua placeholder:text-coklat-sedang/50 focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />

              <label className="px-4 py-2 rounded-lg bg-coklat-tua hover:bg-coklat-sedang text-kertas text-xs font-lora font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#D9C7A3]" />
                <span>{isUploading ? 'Mengunggah...' : 'Unggah Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {coverUrl && (
              <div className="pt-2 flex items-center gap-3">
                <div className="w-16 h-16 rounded-md overflow-hidden border border-garis shrink-0">
                  <img src={coverUrl} alt="Preview sampul" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-coklat-sedang font-lora">
                  <span>Pratinjau foto sampul Polaroid siap ditampilkan saat dibuka.</span>
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="block text-red-700 hover:underline mt-0.5 cursor-pointer"
                  >
                    Hapus foto ini
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tags Manager */}
          <div className="space-y-2">
            <label className="block text-xs font-elite tracking-wider uppercase text-coklat-tua">
              Label / Topik (Tag)
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-kertas border border-garis text-xs font-lora text-coklat-tua"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-coklat-sedang hover:text-red-700 cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Ketik topik lalu tekan Tambah..."
                className="w-64 px-3 py-1.5 rounded-lg bg-kertas border border-garis font-lora text-xs text-coklat-tua focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 rounded-lg bg-garis/50 hover:bg-garis text-coklat-tua font-lora text-xs cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            {/* Quick tag suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-lora text-coklat-sedang">
              <span>Saran:</span>
              {POPULAR_TAGS.filter((t) => t !== 'Semua').map((pt) => (
                <button
                  type="button"
                  key={pt}
                  onClick={() => handleAddTag(pt)}
                  className="hover:text-terracotta underline cursor-pointer"
                >
                  +{pt}
                </button>
              ))}
            </div>
          </div>

          {/* Content: Markdown Editor & Live Preview Switcher */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-garis pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-lora font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'write'
                      ? 'bg-coklat-tua text-krem'
                      : 'text-coklat-sedang hover:text-coklat-tua'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Tulis (Markdown)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-lora font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-coklat-tua text-krem'
                      : 'text-coklat-sedang hover:text-coklat-tua'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Lembar</span>
                </button>
              </div>

              <span className="text-[11px] font-elite text-coklat-sedang hidden sm:inline">
                Mendukung: **tebal**, *miring*, &gt; kutipan, - daftar, ![alt](url)
              </span>
            </div>

            {activeTab === 'write' ? (
              <textarea
                id="entry-content"
                aria-label="Isi lembar catatan dalam format Markdown"
                required
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mulai tuangkan isi catatan di sini...

Gunakan tanda bintang untuk *teks miring* atau **teks tebal**.
Gunakan tanda > untuk kutipan puitis.
Gunakan * untuk poin berpolet."
                className="w-full p-4 rounded-xl bg-kertas border border-garis font-lora text-base text-coklat-tua leading-relaxed placeholder:text-coklat-sedang/40 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta resize-y"
              />
            ) : (
              <div className="paper-sheet rounded-xl p-6 sm:p-8 border border-garis min-h-[380px]">
                {coverUrl && (
                  <div className="mb-6 flex justify-center">
                    <PolaroidImage src={coverUrl} alt={title || 'Pratinjau'} caption={title} />
                  </div>
                )}
                {content ? (
                  <MarkdownView content={content} />
                ) : (
                  <p className="font-lora text-sm text-coklat-sedang italic text-center py-12">
                    Belum ada teks yang ditulis untuk dipratinjau.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-garis flex items-center justify-between gap-4">
            <Link
              to="/admin"
              className="px-4 py-2.5 rounded-xl bg-kertas hover:bg-garis/30 text-coklat-sedang border border-garis text-sm font-lora transition-colors"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-coklat-tua hover:bg-coklat-sedang text-kertas text-sm font-lora font-medium shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="w-4 h-4 text-[#D9C7A3]" />
              <span>{isSaving ? 'Menyimpan Catatan...' : 'Simpan Lembar Catatan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
