import React from 'react';
import { Link } from 'react-router-dom';
import { Pin, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Entry } from '../types';

interface EntryCardProps {
  entry: Entry;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  // Format date in Indonesian style
  const formattedDate = new Date(entry.entry_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Extract plain text preview from markdown content
  const plainText = entry.content
    .replace(/#+\s+/g, '')
    .replace(/>\s+/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();

  const excerpt = plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;

  return (
    <article className="paper-card page-flip-effect rounded-lg p-5 sm:p-6 flex flex-col justify-between group cursor-pointer border border-garis/80 hover:border-terracotta/40 transition-colors">
      <div>
        {/* Top Header: Date, Mood & Pin */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-coklat-sedang font-elite">
            <Calendar className="w-3.5 h-3.5 text-terracotta" />
            <time dateTime={entry.entry_date}>{formattedDate}</time>
          </div>

          <div className="flex items-center gap-2">
            {entry.mood && (
              <span className="font-caveat text-sm font-semibold px-2.5 py-0.5 rounded-full bg-garis/40 text-coklat-tua border border-garis/60">
                {entry.mood}
              </span>
            )}
            {entry.is_pinned && (
              <span
                title="Disematkan"
                className="flex items-center gap-1 text-[11px] font-elite uppercase tracking-wider text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full border border-terracotta/20"
              >
                <Pin className="w-3 h-3 fill-terracotta text-terracotta" />
                <span>Pin</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-playfair text-xl sm:text-2xl font-bold text-coklat-tua group-hover:text-terracotta transition-colors leading-snug mb-2.5">
          <Link to={`/buku/${entry.slug}`} className="focus:outline-none">
            {entry.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="font-lora text-sm sm:text-base text-coklat-tua/80 leading-relaxed line-clamp-3 mb-4">
          {excerpt}
        </p>
      </div>

      <div>
        {/* Tags and Read link */}
        <div className="pt-3 border-t border-garis/50 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            {entry.tags && entry.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-lora text-coklat-sedang bg-krem/70 px-2 py-0.5 rounded-md border border-garis/40"
              >
                <Tag className="w-2.5 h-2.5 text-terracotta/70" />
                {tag}
              </span>
            ))}
            {entry.tags && entry.tags.length > 3 && (
              <span className="text-xs text-coklat-sedang font-lora">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>

          <Link
            to={`/buku/${entry.slug}`}
            className="inline-flex items-center gap-1 text-xs font-elite tracking-wider uppercase text-terracotta font-semibold group-hover:translate-x-1 transition-transform duration-200"
          >
            <span>Buka Lembar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
