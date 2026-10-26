import React, { useRef, useEffect } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import { ThreadPost } from '../types';

interface DateBarProps {
  threads?: ThreadPost[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  className?: string;
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const parseLocalDate = (dateStr: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day)
    ? date
    : null;
};

export const formatIndonesianDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  return date
    ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    : dateStr;
};

export const DateBar: React.FC<DateBarProps> = ({
  threads = [],
  selectedDate,
  onSelectDate,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const threadDates = new Set<string>();
  threads.forEach((thread) => {
    const date = new Date(thread.created_at);
    if (!Number.isNaN(date.getTime())) {
      threadDates.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    }
  });

  const datesRange = Array.from({ length: 33 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index - 18);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return {
      dateStr,
      dayNum: date.getDate(),
      dayName: DAY_NAMES[date.getDay()],
      monthShort: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date).replace('.', ''),
      isToday: dateStr === todayStr,
      hasThread: threadDates.has(dateStr),
    };
  });

  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const item = activeItemRef.current;
      container.scrollTo({
        left: item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedDate]);

  const headerDate = selectedDate ? parseLocalDate(selectedDate) ?? today : today;
  const headerDateLabel = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(headerDate);

  return (
    <section className={`paper-card rounded-2xl p-3.5 sm:p-5 ${className}`} aria-label="Saring catatan berdasarkan tanggal">
      <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-garis/80 pb-3 sm:mb-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <Calendar className="h-4 w-4 shrink-0 text-lumut" aria-hidden="true" />
          <h2 className="font-playfair text-lg font-semibold leading-tight text-coklat-tua sm:text-xl">{headerDateLabel}</h2>
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            aria-label="Hapus filter tanggal dan tampilkan semua catatan"
            title="Tampilkan semua catatan"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lumut transition-colors hover:bg-lumut/10"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />

          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="date-rail no-scrollbar flex select-none items-center gap-2 overflow-x-auto overscroll-x-contain px-0.5 py-1 touch-pan-x"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {datesRange.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          const isTarget = isSelected || (selectedDate === null && item.isToday);
          return (
            <button
              type="button"
              key={item.dateStr}
              ref={isTarget ? activeItemRef : null}
              onClick={() => onSelectDate(isSelected ? null : item.dateStr)}
              aria-pressed={isSelected}
              aria-label={`${item.isToday ? 'Hari ini, ' : ''}${item.dayName}, ${item.dayNum} ${item.monthShort}${item.hasThread ? ', ada catatan' : ''}`}
              title={item.hasThread ? 'Ada catatan pada tanggal ini' : undefined}
              className={`relative flex h-[76px] shrink-0 snap-center flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-colors sm:h-[82px] ${item.isToday ? 'w-[74px] sm:w-[78px]' : 'w-[54px] sm:w-[60px]'} ${isSelected ? 'border-coklat-tua bg-coklat-tua text-kertas' : item.isToday ? 'border-lumut bg-lumut/5 text-coklat-tua' : 'border-garis bg-kertas text-coklat-tua hover:border-lumut/50 hover:bg-krem'}`}
            >
              {item.isToday ? (
                <span className={`whitespace-nowrap font-playfair text-sm font-semibold sm:text-base ${isSelected ? 'text-[#E1E9DC]' : 'text-lumut'}`}>
                  Hari ini
                </span>
              ) : (
                <>
                  <span className={`text-[13px] font-semibold ${isSelected ? 'text-[#E1E9DC]' : 'text-coklat-sedang'}`}>{item.dayName}</span>
                  <span className="font-playfair text-2xl font-semibold leading-none tabular-nums sm:text-2xl">{item.dayNum}</span>
                  {item.hasThread && !item.isToday && (
                    <span className={`absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${isSelected ? 'bg-[#E1E9DC]' : 'bg-lumut'}`} aria-hidden="true" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[13px] leading-relaxed text-coklat-sedang">Geser tanggal untuk melihat hari lain, atau pilih untuk menyaring catatan.</p>
    </section>
  );
};
