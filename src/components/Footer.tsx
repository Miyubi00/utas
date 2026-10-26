import React from 'react';
import { useSiteSettings } from '../lib/siteSettingsContext';

export const Footer: React.FC = () => {
  const { settings, authorHandle } = useSiteSettings();
  return (
  <footer className="mt-12 border-t border-garis/90 bg-kertas/65 px-4 py-6 sm:mt-16 sm:px-6 sm:py-7">
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
      <span className="font-playfair text-xl font-semibold tracking-tight text-coklat-tua">
        {settings.site_name}
      </span>
      <span className="text-[13px] text-coklat-sedang sm:text-sm">
        {authorHandle}<span className="mx-1.5 text-garis" aria-hidden="true">·</span>© {new Date().getFullYear()}
      </span>
    </div>
  </footer>
  );
};
