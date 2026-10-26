import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { ThreadPost } from '../types';

interface JournalCalendarProps {
  threads?: ThreadPost[];
  selectedDate?: string | null;
  onSelectDate?: (dateStr: string | null) => void;
  className?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const JournalCalendar: React.FC<JournalCalendarProps> = ({
  threads = [],
  selectedDate = null,
  onSelectDate,
  className = '',
}) => {
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Find all dates that have threads (format: YYYY-MM-DD)
  const threadDates = new Set<string>();
  threads.forEach((t) => {
    try {
      const d = new Date(t.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      threadDates.add(`${yyyy}-${mm}-${dd}`);
    } catch {
      // ignore invalid date
    }
  });

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleResetToday = () => {
    setCurrentMonthDate(new Date());
    if (onSelectDate) onSelectDate(null);
  };

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Days grid
  const days: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete 35 or 42 cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div
      className={`paper-sheet rounded-xl p-3 sm:p-4 border border-garis/80 max-w-sm mx-auto shadow-xs text-coklat-tua select-none ${className}`}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-garis/60">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-terracotta" />
          <span className="font-playfair font-bold text-sm text-coklat-tua">
            {MONTH_NAMES[month]} {year}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetToday}
            title="Kembali ke Hari Ini"
            className="p-1 rounded text-coklat-sedang hover:text-coklat-tua hover:bg-garis/30 transition-colors cursor-pointer text-xs flex items-center gap-0.5"
            aria-label="Kembali ke hari ini"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded text-coklat-sedang hover:text-coklat-tua hover:bg-garis/30 transition-colors cursor-pointer"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded text-coklat-sedang hover:text-coklat-tua hover:bg-garis/30 transition-colors cursor-pointer"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-elite text-[10px] text-coklat-sedang/80 mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={i} className={i === 0 ? 'text-red-700/80 font-bold' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((item, idx) => {
          const isToday = item.dateStr === todayStr;
          const isSelected = selectedDate === item.dateStr;
          const hasThread = threadDates.has(item.dateStr);

          return (
            <button
              type="button"
              key={idx}
              disabled={!item.isCurrentMonth}
              onClick={() => {
                if (!item.isCurrentMonth || !onSelectDate) return;
                onSelectDate(isSelected ? null : item.dateStr);
              }}
              className={`relative h-7 sm:h-8 rounded flex flex-col items-center justify-center font-lora text-xs transition-colors cursor-pointer ${
                !item.isCurrentMonth
                  ? 'text-coklat-sedang/30 cursor-default'
                  : isSelected
                  ? 'bg-coklat-tua text-kertas font-bold shadow-xs'
                  : isToday
                  ? 'border border-terracotta text-terracotta font-semibold bg-terracotta/10'
                  : 'hover:bg-garis/40 text-coklat-tua'
              }`}
            >
              <span>{item.dayNumber}</span>
              {/* Dot indicator if thread exists on this day */}
              {hasThread && item.isCurrentMonth && (
                <span
                  className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-kertas' : 'bg-terracotta'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Date Filter Status Badge (if filtered) */}
      {selectedDate && (
        <div className="mt-2.5 pt-2 border-t border-garis/60 flex items-center justify-between text-[11px] font-elite text-coklat-tua">
          <span className="truncate">
            Menyaring: <strong className="text-terracotta">{selectedDate}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSelectDate && onSelectDate(null)}
            className="text-red-700 hover:underline font-semibold ml-2 cursor-pointer shrink-0"
          >
            Hapus Saring
          </button>
        </div>
      )}
    </div>
  );
};
