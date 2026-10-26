import React from 'react';
import { Pin, Feather, Clock } from 'lucide-react';
import { ThreadPost } from '../types';
import { useSiteSettings } from '../lib/siteSettingsContext';

interface ThreadCardProps {
  post: ThreadPost;
  footer?: React.ReactNode;
  replyComposer?: React.ReactNode;
  headerAction?: React.ReactNode;
  showPinnedBadge?: boolean;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  post,
  footer,
  replyComposer,
  headerAction,
  showPinnedBadge = true,
}) => {
  const { authorHandle } = useSiteSettings();
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays < 7) return `${diffDays} hari lalu`;

      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  const hasReplies = Boolean(post.replies?.length);

  return (
    <article className="paper-card relative rounded-2xl p-4 sm:p-6">
      <div className="relative">
        {hasReplies && <div className="thread-line" aria-hidden="true" />}

        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-garis bg-krem text-lumut sm:h-11 sm:w-11">
            <Feather className="h-[17px] w-[17px]" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="font-playfair text-base font-semibold text-coklat-tua sm:text-lg">{authorHandle}</span>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug text-coklat-sedang">
                {showPinnedBadge && post.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lumut/10 px-2 py-1 font-medium text-lumut">
                    <Pin className="h-3 w-3 fill-current" aria-hidden="true" />
                    <span>Disematkan</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={post.created_at}>{formatTime(post.created_at)}</time>
                </span>
                </div>
                {headerAction}
              </div>
            </div>

            <p className="mt-3 break-words whitespace-pre-wrap font-reading text-base leading-[1.65] text-coklat-tua sm:text-lg sm:leading-[1.7]">
              {post.content}
            </p>

            {post.images && post.images.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {post.images.map((imgUrl, index) => (
                  <div key={index} className="overflow-hidden rounded-xl border border-garis bg-krem">
                    <img src={imgUrl} alt="Lampiran utas" width="640" height="480" loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasReplies && (
        <div className="mt-5 space-y-3 pl-1 sm:mt-6 sm:pl-2">
          {post.replies!.map((reply) => (
            <div key={reply.id} className="relative flex items-start gap-2.5 sm:gap-3">
              <div className="relative z-10 ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-garis bg-kertas text-coklat-sedang sm:ml-1">
                <Feather className="h-3.5 w-3.5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1 rounded-xl border border-garis/80 bg-krem/65 p-3.5 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-playfair text-sm font-semibold text-coklat-tua">{authorHandle}</span>
                  </div>
                  <time dateTime={reply.created_at} className="text-[13px] leading-snug text-coklat-sedang">{formatTime(reply.created_at)}</time>
                </div>

                <p className="mt-2 break-words whitespace-pre-wrap font-reading text-[15px] leading-[1.65] text-coklat-tua sm:text-base sm:leading-[1.7]">
                  {reply.content}
                </p>

                {reply.images && reply.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {reply.images.map((imgUrl, index) => (
                      <div key={index} className="overflow-hidden rounded-lg border border-garis/80">
                        <img src={imgUrl} alt="Lampiran balasan" width="640" height="480" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {footer && (
        <div className="mt-5 border-t border-garis/80 pt-3 sm:mt-6">
          {footer}
        </div>
      )}

      {replyComposer && <div className="mt-3">{replyComposer}</div>}
    </article>
  );
};
