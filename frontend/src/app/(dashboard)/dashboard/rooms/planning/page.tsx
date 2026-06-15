'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays, BedDouble,
  X, Save, AlertTriangle, Wrench, PaintBucket, Ban, Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRoomPlanning } from '@/features/hooks';

// ─── Types ───────────────────────────────────────────────

interface RoomCal {
  id: string; name: string; type: string; status: string; roomNumber?: string;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Std', VIP: 'VIP', SUITE: 'Ste', STUDIO: 'Stu',
  APARTMENT: 'App', VILLA: 'Vil', DORMITORY: 'Dor', FAMILY: 'Fam',
  DOUBLE: 'Dbl', SINGLE: 'Sng', DELUXE: 'Dlx', BUNGALOW: 'Bun',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  AVAILABLE:   { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-300', label: 'Disponible', dot: 'bg-emerald-500' },
  RESERVED:    { bg: 'bg-blue-50 dark:bg-blue-900/10',      text: 'text-blue-700 dark:text-blue-300',      label: 'Réservée',   dot: 'bg-blue-500' },
  OCCUPIED:    { bg: 'bg-purple-50 dark:bg-purple-900/10',   text: 'text-purple-700 dark:text-purple-300',  label: 'Occupée',    dot: 'bg-purple-500' },
  CLEANING:    { bg: 'bg-amber-50 dark:bg-amber-900/10',     text: 'text-amber-700 dark:text-amber-300',    label: 'Nettoyage',  dot: 'bg-amber-500' },
  MAINTENANCE: { bg: 'bg-orange-50 dark:bg-orange-900/10',   text: 'text-orange-700 dark:text-orange-300',  label: 'Maintenance', dot: 'bg-orange-500' },
  CLOSED:      { bg: 'bg-gray-100 dark:bg-gray-800',         text: 'text-gray-500',                         label: 'Fermée',     dot: 'bg-gray-400' },
  BLOCKED:     { bg: 'bg-red-50 dark:bg-red-900/10',         text: 'text-red-700 dark:text-red-300',        label: 'Bloquée',    dot: 'bg-red-500' },
};

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

function isToday(y: number, m: number, d: number | null) {
  if (!d) return false;
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
}

function isWeekend(y: number, m: number, d: number | null) {
  if (!d) return false;
  const day = new Date(y, m, d).getDay();
  return day === 0 || day === 6;
}

const BLOCK_REASONS = [
  { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'text-orange-600 bg-orange-50' },
  { value: 'CLEANING', label: 'Nettoyage', icon: PaintBucket, color: 'text-amber-600 bg-amber-50' },
  { value: 'BLOCKED', label: 'Bloquée', icon: Ban, color: 'text-red-600 bg-red-50' },
  { value: 'CLOSED', label: 'Fermée', icon: AlertTriangle, color: 'text-gray-600 bg-gray-50' },
  { value: 'EVENT', label: 'Événement', icon: CalendarDays, color: 'text-purple-600 bg-purple-50' },
];

export default function PlanningPage() {
  const { data: planningData, isLoading } = useRoomPlanning();
  const rooms: RoomCal[] = useMemo(() => {
    const d = planningData?.rooms || planningData || [];
    return Array.isArray(d) ? d : [];
  }, [planningData]);

  const events: any[] = useMemo(() => {
    const d = planningData?.bookings || [];
    return Array.isArray(d) ? d : [];
  }, [planningData]);

  const blocks: any[] = useMemo(() => {
    const d = planningData?.blocks || [];
    return Array.isArray(d) ? d : [];
  }, [planningData]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedCell, setSelectedCell] = useState<{ roomId: string; date: string } | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ reason: 'MAINTENANCE', notes: '', startDate: '', endDate: '' });

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const navPrev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const navNext = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday = () => { const t = new Date(); setYear(t.getFullYear()); setMonth(t.getMonth()); };

  const getRoomStatusForDate = (roomId: string, dateStr: string): { status: string; label: string } => {
    const block = blocks.find((b: any) => b.roomId === roomId && dateStr >= b.startDate && dateStr <= b.endDate);
    if (block) return { status: block.reason, label: BLOCK_REASONS.find(r => r.value === block.reason)?.label || block.reason };
    const booking = events.find((b: any) => b.roomId === roomId && dateStr >= b.checkIn && dateStr <= b.checkOut);
    if (booking) return { status: 'RESERVED', label: booking.clientName || 'Réservé' };
    const room = rooms.find(r => r.id === roomId);
    return { status: room?.status === 'MAINTENANCE' || room?.status === 'BLOCKED' ? room.status : 'AVAILABLE', label: '' };
  };

  const handleCellClick = (roomId: string, day: number | null) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedCell({ roomId, date: dateStr });
    setBlockForm({ reason: 'MAINTENANCE', notes: '', startDate: dateStr, endDate: dateStr });
    setShowBlockModal(true);
  };

  const handleBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBlockModal(false);
    setSelectedCell(null);
  };

  const stats = useMemo(() => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    let available = 0, reserved = 0, occupied = 0, maintenance = 0, blocked = 0;
    rooms.forEach(r => {
      const s = getRoomStatusForDate(r.id, dateStr).status;
      if (s === 'AVAILABLE') available++;
      else if (s === 'RESERVED') reserved++;
      else if (s === 'OCCUPIED') occupied++;
      else if (s === 'MAINTENANCE') maintenance++;
      else blocked++;
    });
    return { total: rooms.length, available, reserved, occupied, maintenance, blocked };
  }, [year, month, rooms, events, blocks]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Planning disponibilités</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Calendrier mensuel des chambres et logements</p>
        </div>
        <Link href="/dashboard/rooms">
          <Button variant="outline" size="sm"><BedDouble className="h-4 w-4 mr-1.5" />Retour aux chambres</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Card className="p-3 text-center"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p></Card>
        <Card className="p-3 text-center border-emerald-200 dark:border-emerald-800"><p className="text-xs text-emerald-600 font-medium">Disponibles</p><p className="text-lg font-bold text-emerald-600">{stats.available}</p></Card>
        <Card className="p-3 text-center border-blue-200 dark:border-blue-800"><p className="text-xs text-blue-600 font-medium">Réservées</p><p className="text-lg font-bold text-blue-600">{stats.reserved}</p></Card>
        <Card className="p-3 text-center border-purple-200 dark:border-purple-800"><p className="text-xs text-purple-600 font-medium">Occupées</p><p className="text-lg font-bold text-purple-600">{stats.occupied}</p></Card>
        <Card className="p-3 text-center border-orange-200 dark:border-orange-800"><p className="text-xs text-orange-600 font-medium">Maintenance</p><p className="text-lg font-bold text-orange-600">{stats.maintenance}</p></Card>
        <Card className="p-3 text-center border-red-200 dark:border-red-800"><p className="text-xs text-red-600 font-medium">Bloquées</p><p className="text-lg font-bold text-red-600">{stats.blocked}</p></Card>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <button onClick={navPrev} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeft className="h-5 w-5 text-gray-500" /></button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">{MONTHS[month]} {year}</h2>
          <button onClick={navNext} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRight className="h-5 w-5 text-gray-500" /></button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-700 transition-colors">Aujourd'hui</button>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {Object.entries(STATUS_STYLES).map(([key, s]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-full', s.dot)} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-[200px_repeat(31,minmax(28px,1fr))] overflow-x-auto scrollbar-hide">
          <div className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 p-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Chambres</span>
          </div>
          {days.map((d, i) => (
            <div key={i} className={cn('border-b border-r border-gray-100 dark:border-gray-700 p-1.5 text-center', isWeekend(year, month, d) && 'bg-gray-50 dark:bg-gray-700/30')}>
              {d && <div className={cn('text-xs font-medium', isToday(year, month, d) ? 'text-brand' : isWeekend(year, month, d) ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300')}>{d}</div>}
            </div>
          ))}
        </div>
        {rooms.map(room => (
          <div key={room.id} className="grid grid-cols-[200px_repeat(31,minmax(28px,1fr))] overflow-x-auto scrollbar-hide border-t border-gray-100 dark:border-gray-700">
            <div className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 p-2 flex items-center gap-2">
              <BedDouble className="h-3.5 w-3.5 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{room.name}</p>
                <p className="text-[10px] text-gray-400">{ROOM_TYPE_LABELS[room.type] || room.type}{room.roomNumber ? ` · N°${room.roomNumber}` : ''}</p>
              </div>
            </div>
            {days.map((d, i) => {
              if (!d) return <div key={i} className="border-r border-b border-gray-100 dark:border-gray-700" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const cellInfo = getRoomStatusForDate(room.id, dateStr);
              const style = STATUS_STYLES[cellInfo.status];
              return (
                <button key={i} onClick={() => handleCellClick(room.id, d)}
                  className={cn('border-r border-b border-gray-100 dark:border-gray-700 p-0.5 relative group cursor-pointer transition-all duration-100 hover:ring-2 hover:ring-brand/30 hover:z-10',
                    style?.bg || 'bg-white dark:bg-gray-800', isWeekend(year, month, d) && 'bg-opacity-70',
                    selectedCell?.roomId === room.id && selectedCell?.date === dateStr && 'ring-2 ring-brand')}
                  title={`${room.name} - ${d} ${MONTHS[month]} ${year}: ${style?.label || cellInfo.status}`}>
                  {cellInfo.status !== 'AVAILABLE' && (
                    <div className="absolute inset-0.5 rounded flex items-center justify-center">
                      {cellInfo.status === 'RESERVED' && <div className="w-full h-full bg-blue-200/60 dark:bg-blue-500/20 rounded" />}
                      {cellInfo.status === 'OCCUPIED' && <div className="w-full h-full bg-purple-200/60 dark:bg-purple-500/20 rounded" />}
                      {cellInfo.status === 'CLEANING' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto" />}
                      {cellInfo.status === 'MAINTENANCE' && <Wrench className="h-3 w-3 text-orange-500 mx-auto" />}
                      {cellInfo.status === 'BLOCKED' && <Ban className="h-3 w-3 text-red-500 mx-auto" />}
                      {cellInfo.status === 'CLOSED' && <X className="h-3 w-3 text-gray-400 mx-auto" />}
                    </div>
                  )}
                  {cellInfo.status !== 'AVAILABLE' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      {cellInfo.label || style?.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowBlockModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bloquer des dates</h3>
              <button onClick={() => setShowBlockModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motif du blocage</label>
                <div className="grid grid-cols-2 gap-2">
                  {BLOCK_REASONS.map(r => {
                    const Icon = r.icon;
                    return <button key={r.value} type="button" onClick={() => setBlockForm(f => ({ ...f, reason: r.value }))}
                      className={cn('flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors', blockForm.reason === r.value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300')}>
                      <Icon className="h-4 w-4" />{r.label}</button>;
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date début" type="date" value={blockForm.startDate} onChange={e => setBlockForm(f => ({ ...f, startDate: e.target.value }))} />
                <Input label="Date fin" type="date" value={blockForm.endDate} onChange={e => setBlockForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div><label className="block text-sm font-medium mb-2">Notes</label>
                <textarea value={blockForm.notes} onChange={e => setBlockForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100 text-sm" rows={3} /></div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBlockModal(false)}>Annuler</Button>
                <Button type="submit"><Save className="h-4 w-4 mr-1.5" />Bloquer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
