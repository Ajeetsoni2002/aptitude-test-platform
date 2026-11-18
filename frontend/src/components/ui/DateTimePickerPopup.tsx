import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimePickerPopupProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  label?: string;
  accentColor?: 'cyan' | 'violet' | 'magenta';
  placeholder?: string;
  trigger?: React.ReactNode;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DateTimePickerPopup({
  value,
  onChange,
  minDate,
  label,
  accentColor = 'cyan',
  placeholder = 'Select date & time',
  trigger
}: DateTimePickerPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local state for calendar navigation
  const [viewDate, setViewDate] = useState<Date>(value || new Date());
  
  // Local state for time
  const [hours, setHours] = useState<string>(value ? String(value.getHours() % 12 || 12).padStart(2, '0') : '12');
  const [minutes, setMinutes] = useState<string>(value ? String(value.getMinutes()).padStart(2, '0') : '00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(value ? (value.getHours() >= 12 ? 'PM' : 'AM') : 'AM');

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
      setHours(String(value.getHours() % 12 || 12).padStart(2, '0'));
      setMinutes(String(value.getMinutes()).padStart(2, '0'));
      setAmpm(value.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateDateTime = (newDate: Date, h: string, m: string, ap: 'AM' | 'PM') => {
    const updated = new Date(newDate);
    let hour = parseInt(h, 10);
    if (ap === 'PM' && hour !== 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
    
    updated.setHours(hour, parseInt(m, 10), 0, 0);
    
    // Check against minDate if changing time makes it invalid
    if (minDate && updated < minDate) {
      onChange(minDate);
      return;
    }
    onChange(updated);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    updateDateTime(newDate, hours, minutes, ampm);
  };

  const handleTimeChange = (type: 'h' | 'm' | 'ap', val: string) => {
    let newH = hours;
    let newM = minutes;
    let newAp = ampm;

    if (type === 'h') {
      newH = val;
      setHours(val);
    }
    if (type === 'm') {
      newM = val;
      setMinutes(val);
    }
    if (type === 'ap') {
      newAp = val as 'AM' | 'PM';
      setAmpm(newAp as 'AM' | 'PM');
    }

    if (value) {
      updateDateTime(value, newH, newM, newAp);
    } else {
      updateDateTime(viewDate, newH, newM, newAp);
    }
  };

  const handleQuickSelect = (preset: 'today' | 'tomorrow' | 'nextWeek' | '+1h' | '+24h') => {
    const now = new Date();
    let target = new Date();
    
    switch (preset) {
      case 'today':
        target.setHours(12, 0, 0, 0);
        break;
      case 'tomorrow':
        target.setDate(now.getDate() + 1);
        target.setHours(12, 0, 0, 0);
        break;
      case 'nextWeek':
        target.setDate(now.getDate() + 7);
        target.setHours(12, 0, 0, 0);
        break;
      case '+1h':
        target.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
        break;
      case '+24h':
        target.setDate(now.getDate() + 1);
        target.setHours(now.getHours(), now.getMinutes(), 0, 0);
        break;
    }
    
    if (minDate && target < minDate) {
      target = new Date(minDate);
    }
    
    updateDateTime(target, 
      String(target.getHours() % 12 || 12).padStart(2, '0'),
      String(target.getMinutes()).padStart(2, '0'),
      target.getHours() >= 12 ? 'PM' : 'AM'
    );
    setIsOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [viewDate]);

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const dateToCheck = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 23, 59, 59);
    return dateToCheck < minDate;
  };

  const accentMap = {
    cyan: 'bg-brand text-on-brand hover:bg-brand',
    violet: 'bg-plum text-on-brand hover:bg-plum',
    magenta: 'bg-clay text-on-brand hover:bg-clay'
  };
  const accentTextMap = {
    cyan: 'text-brand',
    violet: 'text-plum',
    magenta: 'text-clay'
  };
  const accentBorderMap = {
    cyan: 'border-brand',
    violet: 'border-plum',
    magenta: 'border-clay'
  };

  const activeColor = accentTextMap[accentColor];

  const chipClass = 'shrink-0 h-7 px-2.5 rounded-md border border-line bg-surface text-[12px] font-medium text-ink/70 hover:text-ink hover:border-ink/30 transition-colors';
  const selectClass = 'cyber-input h-9 px-2.5 text-[14px] font-mono tabular appearance-none text-center';

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && !trigger && (
        <label className="block text-[13px] font-medium text-ink/75 mb-1.5">{label}</label>
      )}

      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "cyber-input w-full px-4 py-3 text-sm flex items-center justify-between text-left",
            isOpen && accentBorderMap[accentColor]
          )}
        >
          <span className={cn(value ? 'text-ink' : 'text-ink/40')}>
            {value ? value.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : placeholder}
          </span>
          <Calendar size={16} className={value ? activeColor : 'text-ink/35'} />
        </button>
      )}

      {isOpen && (
        <div className="absolute z-[100] top-full mt-2 w-full min-w-[320px] max-w-[360px] p-4 rounded-[12px] border border-line bg-surface shadow-float section-enter">

          {/* Quick Select */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-line scrollbar-hide">
            <Zap size={14} className="text-ink/40 shrink-0" />
            <button onClick={() => handleQuickSelect('today')} className={chipClass}>Today</button>
            <button onClick={() => handleQuickSelect('tomorrow')} className={chipClass}>Tomorrow</button>
            <button onClick={() => handleQuickSelect('+1h')} className={chipClass}>In 1 hour</button>
            <button onClick={() => handleQuickSelect('+24h')} className={chipClass}>In 24 hours</button>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} aria-label="Previous month" className="w-8 h-8 flex items-center justify-center rounded-md text-ink/55 hover:text-ink hover:bg-ink/5"><ChevronLeft size={18} /></button>
            <div className="text-[14px] font-semibold text-ink">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={nextMonth} aria-label="Next month" className="w-8 h-8 flex items-center justify-center rounded-md text-ink/55 hover:text-ink hover:bg-ink/5"><ChevronRight size={18} /></button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAYS.map(day => (
              <div key={day} className="text-center font-mono text-[10px] uppercase text-ink/45 pb-1">{day}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;

              const isSelected = value?.getDate() === day && value?.getMonth() === viewDate.getMonth() && value?.getFullYear() === viewDate.getFullYear();
              const isDisabled = isDateDisabled(day);

              return (
                <button
                  key={day}
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "h-8 rounded-md flex items-center justify-center text-[13px] font-mono tabular transition-colors",
                    isDisabled ? "text-ink/25 cursor-not-allowed" : "hover:bg-ink/[0.06] cursor-pointer text-ink/85",
                    isSelected ? accentMap[accentColor] : "bg-transparent"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time Selector */}
          <div className="flex items-center justify-center gap-2 pt-3 border-t border-line">
            <Clock size={15} className="text-ink/40" />
            <select
              value={hours}
              onChange={(e) => handleTimeChange('h', e.target.value)}
              aria-label="Hour"
              className={selectClass}
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-ink/45 font-mono font-medium">:</span>
            <select
              value={minutes}
              onChange={(e) => handleTimeChange('m', e.target.value)}
              aria-label="Minute"
              className={selectClass}
            >
              {['00', '15', '30', '45'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex border border-line rounded-[8px] overflow-hidden ml-2 bg-raised">
              <button
                onClick={() => handleTimeChange('ap', 'AM')}
                className={cn("px-2.5 h-9 text-[12px] font-semibold transition-colors", ampm === 'AM' ? "bg-ink text-paper" : "text-ink/55 hover:text-ink")}
              >
                AM
              </button>
              <button
                onClick={() => handleTimeChange('ap', 'PM')}
                className={cn("px-2.5 h-9 text-[12px] font-semibold transition-colors", ampm === 'PM' ? "bg-ink text-paper" : "text-ink/55 hover:text-ink")}
              >
                PM
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
