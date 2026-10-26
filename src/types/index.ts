export type EntryStatus = 'draft' | 'published';

export interface SiteSettings {
  site_name: string;
  username: string;
  tagline: string;
}

export interface Entry {
  id: string;
  title: string;
  slug: string;
  content: string;
  mood: string | null;
  tags: string[];
  cover_url: string | null;
  is_pinned: boolean;
  status: EntryStatus;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadPost {
  id: string;
  short_id?: string;
  parent_id: string | null;
  content: string;
  images: string[];
  status: EntryStatus;
  is_pinned: boolean;
  created_at: string;
  replies?: ThreadPost[];
}

export interface EntryFormData {
  title: string;
  slug: string;
  content: string;
  mood: string;
  tags: string[];
  cover_url: string;
  is_pinned: boolean;
  status: EntryStatus;
  entry_date: string;
}

export interface ThreadFormData {
  content: string;
  parent_id: string | null;
  images: string[];
  status: EntryStatus;
  is_pinned: boolean;
}


