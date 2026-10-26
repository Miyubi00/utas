-- ==============================================================================
-- SKEMA DATABASE: LEMBAR SENJA (DIARY + THREAD)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL: entries
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[] DEFAULT '{}',
    cover_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks untuk performa query
CREATE INDEX IF NOT EXISTS idx_entries_status_created_at ON public.entries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_slug ON public.entries (slug);
CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON public.entries (entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_is_pinned ON public.entries (is_pinned);

-- Trigger untuk memperbarui kolom updated_at secara otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_entries_updated_at ON public.entries;
CREATE TRIGGER set_entries_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABEL: thread_posts
CREATE TABLE IF NOT EXISTS public.thread_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.thread_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks untuk thread
-- Human-friendly IDs used by the Telegram thread commands.
CREATE OR REPLACE FUNCTION public.generate_thread_short_id()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
    candidate TEXT;
    alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
    LOOP
        SELECT string_agg(
            substr(alphabet, floor(random() * length(alphabet) + 1)::INTEGER, 1),
            '' ORDER BY seq
        )
        INTO candidate
        FROM generate_series(1, 6) AS chars(seq);

        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.thread_posts WHERE short_id = candidate
        );
    END LOOP;
    RETURN candidate;
END;
$$;

ALTER TABLE public.thread_posts ADD COLUMN IF NOT EXISTS short_id TEXT;
UPDATE public.thread_posts SET short_id = public.generate_thread_short_id() WHERE short_id IS NULL;
ALTER TABLE public.thread_posts
    ALTER COLUMN short_id SET DEFAULT public.generate_thread_short_id(),
    ALTER COLUMN short_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_thread_posts_short_id ON public.thread_posts (short_id);
CREATE INDEX IF NOT EXISTS idx_thread_posts_parent_id ON public.thread_posts (parent_id);
CREATE INDEX IF NOT EXISTS idx_thread_posts_status_created_at ON public.thread_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_posts_is_pinned ON public.thread_posts (is_pinned);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_posts ENABLE ROW LEVEL SECURITY;

-- Policy Entries:
-- Publik/Anon hanya bisa membaca entri dengan status 'published'
CREATE POLICY "Public read published entries"
    ON public.entries
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admin (authenticated) memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access entries"
    ON public.entries
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy Thread Posts:
-- Publik/Anon hanya bisa membaca thread dengan status 'published'
CREATE POLICY "Public read published threads"
    ON public.thread_posts
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admin (authenticated) memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin full access threads"
    ON public.thread_posts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. STORAGE BUCKET: images
-- Membuat bucket public 'images' bila belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy Storage:
-- Publik dapat melihat/membaca file di bucket images
CREATE POLICY "Public read storage images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'images');

-- Hanya user terotentikasi (admin) yang dapat mengunggah file
CREATE POLICY "Admin upload storage images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'images');

-- Hanya user terotentikasi (admin) yang dapat memperbarui file
CREATE POLICY "Admin update storage images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'images');

-- Hanya user terotentikasi (admin) yang dapat menghapus file
CREATE POLICY "Admin delete storage images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'images');

