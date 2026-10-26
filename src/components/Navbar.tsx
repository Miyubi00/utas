import React from 'react';
import { Link } from 'react-router-dom';
import { Feather } from 'lucide-react';
import { useSiteSettings } from '../lib/siteSettingsContext';

export const Navbar: React.FC = () => {
  const { settings } = useSiteSettings();
  return (
  <header className="w-full border-b border-garis/90 bg-kertas/90 backdrop-blur-md">
    <div className="mx-auto flex min-h-[76px] w-full max-w-5xl items-center px-4 sm:px-6 lg:px-8">
      <Link to="/" className="group flex min-w-0 items-center gap-3 text-coklat-tua transition-colors hover:text-lumut">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-garis bg-krem text-lumut transition-transform group-hover:-rotate-3">
          <Feather className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-playfair text-[1.35rem] font-semibold leading-none tracking-tight sm:text-2xl">
            {settings.site_name}
          </span>
          <span className="mt-1 block max-w-[60vw] text-[13px] leading-snug text-coklat-sedang sm:max-w-none sm:text-sm">
            {settings.tagline}
          </span>
        </span>
      </Link>
    </div>
  </header>
  );
};
