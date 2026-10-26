import type { SiteSettings } from '../types';

// Nilai bawaan template; nama dan username aktif dapat diubah dari Pengaturan.

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  site_name: 'Lembar Senja',
  username: 'lebarsenja',
  tagline: 'Buku catatan hening, kilas rasa, dan penggalan kisah senja',
};

export const SITE_NAME = DEFAULT_SITE_SETTINGS.site_name;

export const SITE_TAGLINE = DEFAULT_SITE_SETTINGS.tagline;

export const SITE_DESCRIPTION = 
  'Jurnal personal berisi kumpulan catatan reflektif, lembaran harian, dan utas pemikiran hening yang ditulis saat langit mulai berselimut jingga.';

export const AUTHOR = {
  handle: `@${DEFAULT_SITE_SETTINGS.username}`,
  bio: 'Mencatat yang sempat singgah di benak sebelum petang berganti malam.',
  location: 'Nusantara',
};

export const MOOD_OPTIONS = [
  { value: 'Tenang', label: 'Tenang 🍃', color: '#8B5E3C' },
  { value: 'Hangat', label: 'Hangat ☕', color: '#B5651D' },
  { value: 'Nostalgia', label: 'Nostalgia 🍂', color: '#A06D45' },
  { value: 'Reflektif', label: 'Reflektif 🌙', color: '#5C4A3A' },
  { value: 'Melankolis', label: 'Melankolis 🌧️', color: '#6A5D52' },
  { value: 'Bersemangat', label: 'Bersemangat ☀️', color: '#C87428' },
  { value: 'Damai', label: 'Damai 🕊️', color: '#7A624E' },
] as const;

export const POPULAR_TAGS = [
  'Semua',
  'Renungan',
  'Keseharian',
  'Buku & Kopi',
  'Malam',
  'Hujan',
  'Perjalanan',
  'Kilas Balik',
];
