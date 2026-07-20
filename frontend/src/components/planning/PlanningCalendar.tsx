'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, Clock, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const SLOT_HEIGHT = 60;
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_LABELS_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_KEYS = [1, 2, 3, 4, 5, 6, 7];

const EMPLOYEE_COLORS = [
  {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
    dot: 'bg-blue-500',
  },
  {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
    dot: 'bg-purple-500',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-600',
    dot: 'bg-amber-500',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-900/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-600',
    dot: 'bg-rose-500',
  },
  {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-600',
    dot: 'bg-cyan-500',
  },
  {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-600',
    dot: 'bg-orange-500',
  },
];

function getEmployeeColor(name: string) {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) + hash + name.charCodeAt(i);
  return EMPLOYEE_COLORS[Math.abs(hash) % EMPLOYEE_COLORS.length];
}

function fmt(t: string) {
  return t?.substring(0, 5) || '08:00';
}
function toM(t: string) {
  const [h, m] = (t || '08:00').split(':').map(Number);
  return h * 60 + m;
}
function fromM(m: number) {
  const h = Math.floor(Math.max(m, 0) / 60);
  const min = Math.max(m, 0) % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function getWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function isToday(d: Date) {
  return new Date().toDateString() === d.toDateString();
}

function weekRange(dates: Date[]) {
  const fmtDate = (d: Date, showYear: boolean) =>
    d.toLocaleDateString('fr', {
      day: 'numeric',
      month: 'short',
      ...(showYear ? { year: 'numeric' } : {}),
    });
  const sameMonth = dates[0].getMonth() === dates[6].getMonth();
  return `${fmtDate(dates[0], false)} – ${fmtDate(dates[6], !sameMonth)}`;
}

function DroppableDayColumn({
  dayKey,
  date,
  children,
}: {
  dayKey: number;
  date: Date;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayKey}` });
  const today = isToday(date);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group relative flex-1 border-l border-gray-200 dark:border-gray-700 min-w-0',
        isOver && 'bg-brand/5'
      )}
    >
      <div
        className={cn(
          'sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-1 py-2 text-center',
          today && 'bg-brand/[0.03]'
        )}
      >
        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {DAY_LABELS[dayKey - 1]}
        </p>
        <p
          className={cn(
            'text-base font-bold leading-tight',
            today ? 'text-brand' : 'text-gray-900 dark:text-gray-100'
          )}
        >
          {date.getDate()}
        </p>
      </div>
      <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT }}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="border-b border-gray-100 dark:border-gray-800/60"
            style={{ height: SLOT_HEIGHT }}
          />
        ))}
        {today && <CurrentTimeIndicator />}
        {children}
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      if (now.getHours() < 8 || now.getHours() >= 20) {
        setTop(null);
        return;
      }
      const min = now.getHours() * 60 + now.getMinutes() - toM('08:00');
      setTop(Math.max(0, Math.min((min / 60) * SLOT_HEIGHT, HOURS.length * SLOT_HEIGHT)));
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);
  if (top === null) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="h-0.5 bg-red-500 rounded-full" />
      <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-800" />
    </div>
  );
}

function ScheduleBlock({
  schedule,
  resizeEndMin,
  onResizeStart,
  isResizing,
  readOnly,
}: {
  schedule: any;
  resizeEndMin: number | null;
  onResizeStart: (e: React.MouseEvent, schedule: any) => void;
  isResizing: boolean;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
    data: schedule,
    disabled: readOnly || isResizing,
  });

  const endMin = isResizing && resizeEndMin !== null ? resizeEndMin : toM(schedule.endTime);
  const startMin = toM(schedule.startTime);
  const top = ((startMin - toM('08:00')) / 60) * SLOT_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT, 20);
  const color = getEmployeeColor(schedule.employeeName || 'Employé');

  return (
    <div
      ref={setNodeRef}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        ...(transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : {}),
      }}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-1 overflow-hidden z-10 select-none transition-shadow hover:shadow-md',
        color.bg,
        color.text,
        color.border,
        !readOnly && !isResizing && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-brand z-50',
        isResizing && 'ring-2 ring-brand z-50'
      )}
      {...attributes}
      {...(readOnly || isResizing ? {} : listeners)}
    >
      <div className="flex items-center gap-1.5 h-full">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold truncate leading-tight">
            {schedule.employeeName || 'Employé'}
          </p>
          <p className="text-[9px] opacity-70">
            {fmt(schedule.startTime)} – {fmt(schedule.endTime)}
          </p>
        </div>
      </div>
      {!readOnly && (
        <div
          onMouseDown={(e) => onResizeStart(e, schedule)}
          className="absolute bottom-0 left-1 right-1 h-1.5 cursor-s-resize hover:bg-black/10 dark:hover:bg-white/10 rounded-b transition-colors"
        />
      )}
    </div>
  );
}

function BlockPreview({ schedule }: { schedule: any }) {
  if (!schedule) return null;
  const c = getEmployeeColor(schedule.employeeName || '');
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2 w-44 shadow-xl rotate-2',
        c.bg,
        c.text,
        c.border
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />
        <p className="text-xs font-semibold truncate">{schedule.employeeName}</p>
      </div>
      <p className="text-[10px] opacity-70 mt-0.5 ml-4">
        {fmt(schedule.startTime)} – {fmt(schedule.endTime)}
      </p>
    </div>
  );
}

function MobileScheduleCard({ schedule }: { schedule: any }) {
  const c = getEmployeeColor(schedule.employeeName || '');
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border', c.border, c.bg)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', c.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{schedule.employeeName || 'Employé'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {fmt(schedule.startTime)} – {fmt(schedule.endTime)}
        </p>
      </div>
      <Badge variant={schedule.isActive !== false ? 'success' : 'warning'} size="xs">
        {schedule.isActive !== false ? 'Actif' : 'Inactif'}
      </Badge>
    </div>
  );
}

interface PlanningCalendarProps {
  schedules: any[];
  onUpdate: (scheduleId: string, data: any) => void;
  onCreate?: (data: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

export default function PlanningCalendar({
  schedules,
  onUpdate,
  onCreate,
  onDelete,
  readOnly = false,
  isLoading,
}: PlanningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resizeEndMin, setResizeEndMin] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const resizeState = useRef<{
    id: string;
    startY: number;
    originalEndMin: number;
    startMin: number;
  } | null>(null);
  const resizeEndRef = useRef<number | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const weekDates = useMemo(() => getWeek(currentDate), [currentDate]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeSchedule = useMemo(
    () => (activeId ? schedules.find((s: any) => s.id === activeId) : null),
    [schedules, activeId]
  );

  const schedulesByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    DAY_KEYS.forEach((k) => (map[k] = []));
    (schedules || []).forEach((s: any) => {
      const d = s.dayOfWeek || 1;
      if (map[d]) map[d].push(s);
      else map[d] = [s];
    });
    return map;
  }, [schedules]);

  const prevWeek = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }, [currentDate]);

  const nextWeek = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }, [currentDate]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleQuickAdd = useCallback(
    (dayKey: number) => {
      if (!onCreate || readOnly) return;
      onCreate({ dayOfWeek: dayKey, startTime: '09:00', endTime: '10:00' });
    },
    [onCreate, readOnly]
  );

  const handleQuickCreateSlot = useCallback(
    (dayKey: number, hourIndex: number) => {
      if (!onCreate || readOnly) return;
      const start = fromM(toM('08:00') + hourIndex * 60);
      const end = fromM(toM('08:00') + (hourIndex + 1) * 60);
      onCreate({ dayOfWeek: dayKey, startTime: start, endTime: end });
    },
    [onCreate, readOnly]
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      if (readOnly) return;
      const { active, over } = e;
      if (!over) return;
      const schedule = active.data.current as any;
      if (!schedule) return;
      const dayStr = over.id.toString();
      if (!dayStr.startsWith('day-')) return;
      const newDay = parseInt(dayStr.replace('day-', ''));
      const duration = toM(schedule.endTime) - toM(schedule.startTime);
      const rect = over.rect;
      if (!rect) return;
      const pointerY = (e.activatorEvent as MouseEvent).clientY - rect.top;
      const snapMins = Math.round(((pointerY / SLOT_HEIGHT) * 60) / 15) * 15;
      const startMins =
        toM('08:00') + Math.max(0, Math.min(snapMins, HOURS.length * 60 - duration));
      const endMins = startMins + duration;
      onUpdateRef.current(schedule.id, {
        dayOfWeek: newDay,
        startTime: fromM(startMins),
        endTime: fromM(endMins),
      });
    },
    [readOnly]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, schedule: any) => {
      if (readOnly) return;
      e.stopPropagation();
      e.preventDefault();
      resizeState.current = {
        id: schedule.id,
        startY: e.clientY,
        originalEndMin: toM(schedule.endTime),
        startMin: toM(schedule.startTime),
      };
    },
    [readOnly]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const rs = resizeState.current;
      if (!rs) return;
      const deltaMin = Math.round((((e.clientY - rs.startY) / SLOT_HEIGHT) * 60) / 15) * 15;
      const newEnd = Math.max(rs.startMin + 30, rs.originalEndMin + deltaMin);
      resizeEndRef.current = newEnd;
      setResizeEndMin(newEnd);
    };
    const onMouseUp = () => {
      const rs = resizeState.current;
      if (rs && resizeEndRef.current !== null) {
        onUpdateRef.current(rs.id, { endTime: fromM(resizeEndRef.current) });
      }
      resizeState.current = null;
      resizeEndRef.current = null;
      setResizeEndMin(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Compute occupied slots for quick-add visibility
  const occupiedSlots = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    (schedules || []).forEach((s: any) => {
      const day = s.dayOfWeek || 1;
      if (!map[day]) map[day] = new Set();
      const startH = toM(s.startTime);
      const endH = toM(s.endTime);
      for (let m = startH; m < endH; m += 60) {
        map[day].add(Math.floor((m - toM('08:00')) / 60));
      }
    });
    return map;
  }, [schedules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs font-semibold text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">
            {weekRange(weekDates)}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-700 text-brand shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Calendrier
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-brand shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === 'calendar' ? (
        schedules.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun horaire cette semaine</p>
            {onCreate && !readOnly && (
              <button
                onClick={() => handleQuickAdd(new Date().getDay() || 7)}
                className="mt-3 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90"
              >
                Ajouter un horaire
              </button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="min-w-[868px]">
                <div className="flex">
                  {/* Time gutter */}
                  <div className="w-14 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="h-[70px]" />
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="flex items-start justify-end pr-2"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        <span className="text-[10px] font-medium text-gray-400 -mt-2 select-none">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  <div className="flex flex-1">
                    {DAY_KEYS.map((key) => (
                      <DroppableDayColumn key={key} dayKey={key} date={weekDates[key - 1]}>
                        {(schedulesByDay[key] || []).map((s: any) => (
                          <ScheduleBlock
                            key={s.id}
                            schedule={s}
                            resizeEndMin={resizeState.current?.id === s.id ? resizeEndMin : null}
                            onResizeStart={handleResizeStart}
                            isResizing={resizeState.current?.id === s.id}
                            readOnly={readOnly}
                          />
                        ))}
                        {!readOnly && onCreate && (
                          <button
                            onClick={() => handleQuickAdd(key)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 text-gray-400 hover:text-brand"
                            title="Ajouter un horaire"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </DroppableDayColumn>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeSchedule ? <BlockPreview schedule={activeSchedule} /> : null}
            </DragOverlay>
          </DndContext>
        )
      ) : (
        /* Mobile-friendly list view */
        <div className="space-y-6">
          {DAY_KEYS.map((key) => {
            const date = weekDates[key - 1];
            const daySchedules = schedulesByDay[key] || [];
            if (daySchedules.length === 0 && !onCreate) return null;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      isToday(date) ? 'text-brand' : 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {DAY_LABELS_LONG[key - 1]}{' '}
                    <span className="font-normal text-gray-500">{date.getDate()}</span>
                  </div>
                  {onCreate && !readOnly && (
                    <button
                      onClick={() => handleQuickAdd(key)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {daySchedules.length === 0 ? (
                  <p className="text-xs text-gray-400 pb-2">Aucun horaire</p>
                ) : (
                  <div className="space-y-2">
                    {daySchedules.map((s: any) => (
                      <MobileScheduleCard key={s.id} schedule={s} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
