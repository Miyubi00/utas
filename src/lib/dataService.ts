import { supabase, isSupabaseConfigured } from './supabase';
import { Entry, ThreadPost, EntryStatus, SiteSettings } from '../types';
import { INITIAL_ENTRIES, INITIAL_THREADS } from './mockData';
import { DEFAULT_SITE_SETTINGS } from '../config/site';

// Local cache for offline/unconfigured preview
let localEntries: Entry[] = [...INITIAL_ENTRIES];
let localThreads: ThreadPost[] = [...INITIAL_THREADS];
const LOCAL_SETTINGS_KEY = 'lembar_senja_site_settings';

const normalizeSiteSettings = (settings: Partial<SiteSettings> | null | undefined): SiteSettings => ({
  site_name: settings?.site_name?.trim() || DEFAULT_SITE_SETTINGS.site_name,
  username: (settings?.username || DEFAULT_SITE_SETTINGS.username).trim().replace(/^@+/, ''),
  tagline: settings?.tagline?.trim() || DEFAULT_SITE_SETTINGS.tagline,
});

export const dataService = {
  // ================= SITE SETTINGS =================
  async getSiteSettings(): Promise<SiteSettings> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('app_settings')
        .select('site_name, username, tagline')
        .eq('id', true)
        .maybeSingle();

      if (error) throw error;
      return normalizeSiteSettings(data);
    }

    try {
      const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
      return normalizeSiteSettings(saved ? JSON.parse(saved) as Partial<SiteSettings> : null);
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  },

  async saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    const normalized = normalizeSiteSettings(settings);
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({ id: true, ...normalized, updated_at: new Date().toISOString() })
        .select('site_name, username, tagline')
        .single();

      if (error) throw error;
      return normalizeSiteSettings(data);
    }

    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(normalized));
    return normalized;
  },

  // ================= ENTRIES =================
  async getEntries(options?: {
    tag?: string;
    search?: string;
    status?: EntryStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: Entry[]; total: number }> {
    const { tag, search, status = 'published', limit = 20, offset = 0 } = options || {};

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('entries')
          .select('*', { count: 'exact' });

        if (status) {
          query = query.eq('status', status);
        }

        if (tag && tag !== 'Semua') {
          query = query.contains('tags', [tag]);
        }

        if (search && search.trim() !== '') {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        query = query
          .order('is_pinned', { ascending: false })
          .order('entry_date', { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (!error && data) {
          return { entries: data as Entry[], total: count || data.length };
        }
        console.warn('Supabase fetch entries notice, using local data fallback:', error?.message);
      } catch (err) {
        console.warn('Supabase entries query exception:', err);
      }
    }

    // Local fallback
    let filtered = localEntries.filter((item) => {
      if (status && item.status !== status) return false;
      if (tag && tag !== 'Semua' && !item.tags.includes(tag)) return false;
      if (search && search.trim() !== '') {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
    });

    const paginated = filtered.slice(offset, offset + limit);
    return { entries: paginated, total: filtered.length };
  },

  async getEntryBySlug(slug: string): Promise<Entry | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) return data as Entry;
      } catch (err) {
        console.warn('Supabase getEntryBySlug error:', err);
      }
    }

    const found = localEntries.find((e) => e.slug === slug);
    return found || null;
  },

  async getEntryById(id: string): Promise<Entry | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) return data as Entry;
      } catch (err) {
        console.warn('Supabase getEntryById error:', err);
      }
    }

    const found = localEntries.find((e) => e.id === id);
    return found || null;
  },

  async saveEntry(entry: Partial<Entry> & { title: string; content: string }): Promise<Entry> {
    const isEdit = Boolean(entry.id);
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      if (isEdit) {
        const { data, error } = await supabase
          .from('entries')
          .update({
            title: entry.title,
            slug: entry.slug,
            content: entry.content,
            mood: entry.mood || null,
            tags: entry.tags || [],
            cover_url: entry.cover_url || null,
            is_pinned: entry.is_pinned ?? false,
            status: entry.status || 'draft',
            entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
          })
          .eq('id', entry.id!)
          .select()
          .single();

        if (error) throw error;
        return data as Entry;
      } else {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            title: entry.title,
            slug: entry.slug,
            content: entry.content,
            mood: entry.mood || null,
            tags: entry.tags || [],
            cover_url: entry.cover_url || null,
            is_pinned: entry.is_pinned ?? false,
            status: entry.status || 'draft',
            entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (error) throw error;
        return data as Entry;
      }
    }

    // Local fallback update
    if (isEdit) {
      const idx = localEntries.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        localEntries[idx] = {
          ...localEntries[idx],
          ...entry,
          updated_at: now,
        } as Entry;
        return localEntries[idx];
      }
    }

    const newEntry: Entry = {
      id: `local-${Date.now()}`,
      title: entry.title,
      slug: entry.slug || entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      content: entry.content,
      mood: entry.mood || null,
      tags: entry.tags || [],
      cover_url: entry.cover_url || null,
      is_pinned: entry.is_pinned || false,
      status: entry.status || 'draft',
      entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
      created_at: now,
      updated_at: now,
    };
    localEntries.unshift(newEntry);
    return newEntry;
  },

  async deleteEntry(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) throw error;
    }
    localEntries = localEntries.filter((e) => e.id !== id);
  },

  async togglePinEntry(id: string, is_pinned: boolean): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('entries').update({ is_pinned }).eq('id', id);
      if (error) throw error;
    }
    const target = localEntries.find((e) => e.id === id);
    if (target) target.is_pinned = is_pinned;
  },

  // ================= THREADS =================
  async getThreads(options?: { status?: EntryStatus }): Promise<ThreadPost[]> {
    const status = options === undefined ? 'published' : options.status;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('thread_posts').select('*');
        if (status) {
          query = query.eq('status', status);
        }

        query = query.order('created_at', { ascending: false });
        const { data, error } = await query;

        if (!error && data) {
          const allPosts = data as ThreadPost[];
          // Group replies under parents
          const rootPosts = allPosts.filter((p) => !p.parent_id);
          const repliesMap = new Map<string, ThreadPost[]>();

          allPosts.forEach((post) => {
            if (post.parent_id) {
              const list = repliesMap.get(post.parent_id) || [];
              list.push(post);
              repliesMap.set(post.parent_id, list);
            }
          });

          // Sort root posts: pinned first, then newest
          rootPosts.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          // Sort replies in chronological order
          rootPosts.forEach((root) => {
            const replies = repliesMap.get(root.id) || [];
            replies.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            root.replies = replies;
          });

          return rootPosts;
        }
      } catch (err) {
        console.warn('Supabase threads query exception:', err);
      }
    }

    // Local fallback
    const filtered = localThreads.filter((t) => !status || t.status === status);
    filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return filtered;
  },

  async saveThread(post: {
    content: string;
    parent_id?: string | null;
    images?: string[];
    status?: EntryStatus;
    is_pinned?: boolean;
  }): Promise<ThreadPost> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('thread_posts')
        .insert({
          content: post.content,
          parent_id: post.parent_id || null,
          images: post.images || [],
          status: post.status || 'published',
          is_pinned: post.is_pinned || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ThreadPost;
    }

    // Local fallback
    const newPost: ThreadPost = {
      id: `local-thread-${Date.now()}`,
      content: post.content,
      parent_id: post.parent_id || null,
      images: post.images || [],
      status: post.status || 'published',
      is_pinned: post.is_pinned || false,
      created_at: now,
      replies: [],
    };

    if (newPost.parent_id) {
      const parent = localThreads.find((t) => t.id === newPost.parent_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(newPost);
      }
    } else {
      localThreads.unshift(newPost);
    }

    return newPost;
  },

  async deleteThread(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('thread_posts').delete().eq('id', id);
      if (error) throw error;
    }
    localThreads = localThreads.filter((t) => {
      if (t.id === id) return false;
      if (t.replies) {
        t.replies = t.replies.filter((r) => r.id !== id);
      }
      return true;
    });
  },

  async togglePinThread(id: string, is_pinned: boolean): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('thread_posts')
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    }
    const target = localThreads.find((t) => t.id === id);
    if (target) target.is_pinned = is_pinned;
  },

  // ================= STORAGE =================
  async uploadImage(file: File): Promise<string> {
    if (!isSupabaseConfigured()) {
      // In local mode, return a data URL or placeholder
      return URL.createObjectURL(file);
    }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `entries/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  },
};
