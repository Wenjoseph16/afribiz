'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingSlots } from '@/features/hooks';

interface SlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onSelect: (time: string) => void;
  resourceId?: string;
  className?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  label: string;
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function generateTimeSlots(startTime: string, endTime: string, duration: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const endSlot = m + duration;
    const eh = Math.floor(endSlot / 60);
    const em = endSlot % 60;
    slots.push({
      startTime: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
      endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
      available: true,
      label: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')} - ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
    });
  }
  return slots;
}

export function SlotPicker({
  selectedDate,
  selectedTime,
  onSelect,
  resourceId,
  className,
}: SlotPickerProps) {
  const { data: slotsData, isLoading } = useBookingSlots();
  const [weekOffset, setWeekOffset] = useState(0);

  const allSlots = Array.isArray(slotsData) ? slotsData : slotsData?.items || slotsData?.data || [];

  // Get day of week for selected date
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();

  // Filter slots for this day
  const daySlots = useMemo(() => {
    return allSlots.filter((s: any) => {
      if (s.dayOfWeek !== dayOfWeek) return false;
      if (resourceId && s.resourceId && s.resourceId !== resourceId) return false;
      return true;
    });
  }, [allSlots, dayOfWeek, resourceId]);

  // Generate available time slots
  const availableSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (const ds of daySlots) {
      const duration = ds.slotDuration || 30;
      const generated = generateTimeSlots(ds.startTime, ds.endTime, duration);
      slots.push(...generated);
    }
    // Deduplicate by startTime
    const seen = new Set<string>();
    return slots.filter((s) => {
      if (seen.has(s.startTime)) return false;
      seen.add(s.startTime);
      return true;
    });
  }, [daySlots]);

  // Navigate weeks
  const navigateWeek = (direction: number) => {
    setWeekOffset((prev) => prev + direction);
  };

  // Generate week days
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="ml-2 text-sm text-white/40">Chargement des créneaux...</span>
      </div>
    );
  }

  if (daySlots.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-10 h-10 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/40">Aucun créneau configuré pour ce jour</p>
        <p className="text-xs text-white/20 mt-1">
          Contactez l&apos;établissement pour les horaires
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek(-1)}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/40 font-medium">
          {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} —{' '}
          {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const hasSlots = allSlots.some((s: any) => s.dayOfWeek === d.getDay());

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={cn(
                'relative p-2 rounded-xl text-center transition-all duration-200',
                isSelected
                  ? 'bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'glass hover:border-white/15',
                isToday && !isSelected && 'border-emerald-500/15'
              )}
            >
              <p className="text-[10px] font-medium text-white/30 uppercase">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'][(d.getDay() + 6) % 7]}
              </p>
              <p
                className={cn(
                  'text-sm font-bold',
                  isSelected ? 'text-emerald-400' : 'text-white/60'
                )}
              >
                {d.getDate()}
              </p>
              {hasSlots && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-4 gap-2"
        >
          {availableSlots.length > 0 ? (
            availableSlots.map((slot) => {
              const isSelected = selectedTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  onClick={() => onSelect(slot.startTime)}
                  className={cn(
                    'relative p-3 rounded-xl text-center transition-all duration-200',
                    isSelected
                      ? 'bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'glass hover:border-white/15 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock
                      className={cn('w-3 h-3', isSelected ? 'text-emerald-400' : 'text-white/30')}
                    />
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        isSelected ? 'text-emerald-400' : 'text-white/60'
                      )}
                    >
                      {slot.startTime}
                    </span>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="slot-selected"
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </button>
              );
            })
          ) : (
            <div className="col-span-full text-center py-6">
              <p className="text-sm text-white/30">Aucun créneau disponible pour cette date</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
