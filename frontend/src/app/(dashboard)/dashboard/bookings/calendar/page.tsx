'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, User, Clock, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMyBusinessBookings } from '@/features/hooks';

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  PENDING: { color: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  CONFIRMED: { color: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ARRIVED: { color: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  IN_PROGRESS: { color: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  COMPLETED: { color: 'border-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  CANCELLED: { color: 'border-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
};

export default function CalendarPage() {
  const router = useRouter();
  const { data: bookingsData, isLoading } = useMyBusinessBookings({ limit: 200 });
  const [currentDate, setCurrentDate] = useState(new Date());

  const allBookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || bookingsData?.data || []);
  const year = currentDate.getFullYear();
  const month = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  // Get bookings for the selected day
  const dateStr = currentDate.toISOString().split('T')[0];
  const dayBookings = allBookings.filter((b: any) => (b.startDate || '').startsWith(dateStr));

  const navigate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  // Generate week days
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getDayBookings = (d: Date) => {
    const ds = d.toISOString().split('T')[0];
    return allBookings.filter((b: any) => (b.startDate || '').startsWith(ds));
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier</h1><p className="text-sm text-gray-500">Visualisez et gérez vos réservations</p></div>
      </div>

      {/* Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{month}</h3>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Aujourd'hui</button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Confirmée</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Arrivé</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500" /> En cours</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> En attente</span>
          </div>
        </div>
      </Card>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d, i) => {
          const ds = d.toISOString().split('T')[0];
          const isToday = ds === new Date().toISOString().split('T')[0];
          const isSelected = ds === dateStr;
          const dayBookingsCount = getDayBookings(d).length;
          return (
            <button key={i} onClick={() => setCurrentDate(d)}
              className={cn('p-2 rounded-lg text-center transition-all', isSelected ? 'bg-brand text-white' : isToday ? 'bg-brand/10 text-brand' : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700')}>
              <p className="text-[10px] font-medium opacity-70">{['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][i]}</p>
              <p className="text-sm font-bold">{d.getDate()}</p>
              {dayBookingsCount > 0 && <p className="text-[9px] mt-0.5 opacity-70">{dayBookingsCount} résa.</p>}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {hours.map((hour) => {
            const timeStr = `${String(hour).padStart(2, '0')}`;
            const hourEvents = dayBookings.filter((b: any) => {
              const h = new Date(b.startDate).getHours();
              return h === hour;
            });
            return (
              <div key={hour} className="flex min-h-[60px] group">
                <div className="w-16 shrink-0 flex items-start justify-center pt-2 text-xs text-gray-400 font-medium border-r border-gray-100 dark:border-gray-700/50">{timeStr}:00</div>
                <div className="flex-1 relative p-1 space-y-1">
                  {hourEvents.length === 0 && (
                    <div className="h-full min-h-[40px]" />
                  )}
                  {hourEvents.map((b: Record<string, any>) => {
                    const ss = STATUS_STYLES[b.status] || STATUS_STYLES.CONFIRMED;
                    return (
                      <div key={b.id} onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                        className={cn('p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow', ss.bg, ss.color)}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900 dark:text-white truncate">{b.title || b.customerName || 'Réservation'}</span>
                          <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded', ss.bg.replace('50','100').replace('/20','/30'))}>{b.status === 'CONFIRMED' ? 'Confirmé' : b.status === 'PENDING' ? 'Attente' : b.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(b.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {b.customerName && <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{b.customerName}</span>}
                          {b.guests > 1 && <span>{b.guests} pers.</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Résumé du {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <Link href="/dashboard/bookings/new">
            <Button size="sm"><span className="text-lg leading-none mr-1">+</span>Réservation</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', value: dayBookings.length, color: '' },
            { label: 'Confirmées', value: dayBookings.filter((b: any) => b.status === 'CONFIRMED').length, color: 'text-blue-600' },
            { label: 'En attente', value: dayBookings.filter((b: any) => b.status === 'PENDING').length, color: 'text-amber-600' },
            { label: 'Revenu', value: dayBookings.filter((b: any) => ['COMPLETED', 'IN_PROGRESS'].includes(b.status)).reduce((a: number, b: any) => a + Number(b.price || 0), 0).toLocaleString() + ' FCFA', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className={cn('text-xl font-bold', s.color || 'text-gray-900 dark:text-white')}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
