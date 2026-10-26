import React from 'react';
import { BookOpen } from 'lucide-react';
import { useSiteSettings } from '../lib/siteSettingsContext';

interface BookCoverFallbackProps {
  onTap?: () => void;
  className?: string;
}

export const BookCoverFallback: React.FC<BookCoverFallbackProps> = ({ onTap, className = '' }) => {
  const { settings, authorHandle } = useSiteSettings();
  return (
    <div
      onClick={onTap}
      role="img"
      aria-label={`Sampul buku jurnal ${settings.site_name}`}
      className={`relative w-64 sm:w-72 h-88 sm:h-96 rounded-r-lg rounded-l-sm bg-gradient-to-r from-[#2F1F17] via-[#4A3426] to-[#3D281C] p-6 text-[#FBF5E6] shadow-2xl transition-transform duration-300 ease-out hover:scale-[1.02] cursor-pointer select-none flex flex-col justify-between border-l-8 border-[#22150E] ${className}`}
      style={{
        boxShadow:
          '14px 18px 36px -4px rgba(47, 31, 23, 0.45), inset 3px 0 6px rgba(255, 255, 255, 0.1), inset -4px 0 10px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Decorative Spine Embossing Lines */}
      <div className="absolute left-2 top-0 bottom-0 w-2 border-r border-[#D9C7A3]/20 pointer-events-none" />
      <div className="absolute left-4 top-0 bottom-0 w-1 border-r border-black/30 pointer-events-none" />

      {/* Gold Foil Border Frame */}
      <div className="absolute inset-4 border border-[#D9C7A3]/30 rounded pointer-events-none flex flex-col justify-between p-3">
        <div className="flex justify-between text-[#D9C7A3]/40 text-xs">
          <span>✤</span>
          <span>✤</span>
        </div>
        <div className="flex justify-between text-[#D9C7A3]/40 text-xs">
          <span>✤</span>
          <span>✤</span>
        </div>
      </div>

      {/* Silk Ribbon Bookmark */}
      <div
        className="absolute top-0 right-8 w-6 h-16 bg-[#B5651D] shadow-md pointer-events-none"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
        }}
      />

      {/* Header Stamp */}
      <div className="relative z-10 pt-4 text-center">
        <span className="font-elite text-xs tracking-widest uppercase text-[#D9C7A3]/70 block mb-1">
          Buku Jurnal Pribadi
        </span>
        <div className="w-12 h-0.5 bg-[#D9C7A3]/40 mx-auto my-2" />
      </div>

      {/* Title & Emblem */}
      <div className="relative z-10 text-center my-auto px-2">
        <div className="w-12 h-12 rounded-full border border-[#D9C7A3]/40 mx-auto mb-4 flex items-center justify-center bg-[#4A3426]/50">
          <BookOpen className="w-6 h-6 text-[#D9C7A3]" />
        </div>
        <h2 className="font-playfair text-2xl sm:text-3xl font-bold tracking-wide text-[#F5ECD7] drop-shadow-sm">
          {settings.site_name}
        </h2>
        <p className="mx-auto mt-2 line-clamp-3 max-w-[12rem] font-caveat text-lg leading-snug text-[#D9C7A3] italic">
          {settings.tagline}
        </p>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center pb-2">
        <p className="font-lora text-xs text-[#D9C7A3]/75">{authorHandle}</p>
        <span className="font-elite text-[10px] text-[#D9C7A3]/50 tracking-wider">
          VOLUME I • MMXXVI
        </span>
      </div>

      {/* Realistic Page Edges on Right */}
      <div
        className="absolute -right-2.5 top-2 bottom-2 w-2.5 bg-gradient-to-r from-[#D9C7A3] to-[#FBF5E6] rounded-r-xs shadow-inner pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FBF5E6, #FBF5E6 2px, #D9C7A3 3px)',
        }}
      />
    </div>
  );
};
