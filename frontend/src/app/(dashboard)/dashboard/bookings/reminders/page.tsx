'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, BellRing, Phone, MessageSquare, Mail, Clock, CheckCircle2, XCircle, Loader, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useMyBusinessBookings } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const CHANNELS = [
  { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  { key: 'SMS', label: 'SMS', icon: Phone, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { key: 'EMAIL', label: 'Email', icon: Mail, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { key: 'PUSH', label: 'Push', icon: Bell, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info'; }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmée', variant: 'success' },
  ARRIVED: { label: 'Arrivé', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'info' },
  COMPLETED: { label: 'Terminée', variant: 'success' },
  CANCELLED: { label: 'Annulée', variant: 'danger' },
};

export default function BookingRemindersPage() {
  const { data: bookingsData, isLoading, refetch } = useMyBusinessBookings({ limit: 100 });
  const [sending, setSending] = useState<string | null>(null);
  const [channel, setChannel] = useState<string>('WHATSAPP');
  const [sentLog, setSentLog] = useState<{ bookingId: string; channel: string; success: boolean }[]>([]);
  const [reminderType, setReminderType] = useState<'REMINDER' | 'ARRIVAL' | 'PAYMENT'>('REMINDER');

  const allBookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || bookingsData?.data || []);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Bookings that need reminders (upcoming today or tomorrow, not cancelled/completed/no-show)
  const pendingReminders = allBookings.filter((b: any) => {
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status)) return false;
    const startDate = new Date(b.startDate || b.date);
    const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).sort((a: any, b: any) => new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime());

  // Recently reminded
  const remindedBookings = allBookings.filter((b: any) => b.reminderSent)
    .sort((a: any, b: any) => new Date(b.remindedAt || b.updatedAt).getTime() - new Date(a.remindedAt || a.updatedAt).getTime())
    .slice(0, 10);

  const handleSendReminder = async (bookingId: string) => {
    setSending(bookingId);
    try {
      await apiClient.post(`/business/bookings/${bookingId}/reminder`, {
        type: reminderType,
        channel,
      });
      setSentLog(prev => [...prev, { bookingId, channel, success: true }]);
      refetch();
    } catch (err) {
      console.error('Reminder send error:', err);
      setSentLog(prev => [...prev, { bookingId, channel, success: false }]);
    } finally {
      setSending(null);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rappels automatiques</h1>
          <p className="text-sm text-gray-500">Envoyez des rappels à vos clients avant leur réservation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100"><Bell className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-[10px] text-gray-500">À rappeler</p><p className="text-sm font-bold text-gray-900 dark:text-white">{pendingReminders.length}</p></div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100"><BellRing className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500">Rappelés</p><p className="text-sm font-bold text-gray-900 dark:text-white">{remindedBookings.length}</p></div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100"><Calendar className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-[10px] text-gray-500">Aujourd'hui</p><p className="text-sm font-bold text-gray-900 dark:text-white">{allBookings.filter((b: any) => (b.startDate || '').startsWith(todayStr) && !['CANCELLED','COMPLETED','NO_SHOW'].includes(b.status)).length}</p></div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100"><MessageSquare className="w-4 h-4 text-purple-600" /></div>
            <div><p className="text-[10px] text-gray-500">WhatsApp</p><p className="text-sm font-bold text-gray-900 dark:text-white">{pendingReminders.filter((b: any) => b.customerPhone).length}</p></div>
          </div>
        </Card>
      </div>

      {/* Reminder Settings */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type de rappel</label>
            <div className="flex gap-2 mt-1.5">
              {[
                { key: 'REMINDER' as const, label: 'Rappel réservation' },
                { key: 'ARRIVAL' as const, label: "Rappel d'arrivée" },
                { key: 'PAYMENT' as const, label: 'Rappel paiement' },
              ].map(t => (
                <button key={t.key} onClick={() => setReminderType(t.key)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    reminderType === t.key ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}>{t.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal par défaut</label>
            <div className="flex gap-2 mt-1.5">
              {CHANNELS.map(ch => (
                <button key={ch.key} onClick={() => setChannel(ch.key)}
                  className={cn('p-2 rounded-lg transition-colors', channel === ch.key ? ch.color + ' ring-2 ring-offset-1' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700')}
                  title={ch.label}>
                  <ch.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Reminders */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Rappels à envoyer ({pendingReminders.length})
        </h2>
        {pendingReminders.length === 0 ? (
          <Card className="text-center py-8">
            <BellRing className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun rappel à envoyer</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingReminders.map((booking: any) => {
              const startDate = new Date(booking.startDate || booking.date);
              const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;
              return (
                <Card key={booking.id} className={cn('p-3 sm:p-4', isToday && 'ring-2 ring-amber-200 dark:ring-amber-800')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{booking.title || booking.customerName || 'Réservation'}</h3>
                        <Badge variant={STATUS_CONFIG[booking.status]?.variant || 'warning'} size="xs">
                          {STATUS_CONFIG[booking.status]?.label || booking.status}
                        </Badge>
                        {isToday && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">Aujourd'hui</span>}
                        {isTomorrow && <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">Demain</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {booking.customerName && <span>{booking.customerName}</span>}
                        {booking.customerPhone && <span className="text-brand">{booking.customerPhone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {CHANNELS.map(ch => (
                        <button key={ch.key}
                          onClick={() => { setChannel(ch.key); handleSendReminder(booking.id); }}
                          disabled={sending === booking.id}
                          className={cn('p-2 rounded-lg transition-all', 
                            sending === booking.id ? 'opacity-50 animate-pulse' : 
                            'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300')}
                          title={`Envoyer par ${ch.label}`}>
                          {sending === booking.id ? <Loader className="w-4 h-4 animate-spin" /> : <ch.icon className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Reminded Log */}
      {remindedBookings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Derniers rappels envoyés
          </h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {remindedBookings.map((booking: any) => (
                <div key={booking.id} className="p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{booking.title || booking.customerName || 'Réservation'}</p>
                      <p className="text-[10px] text-gray-400">{booking.customerName} • {booking.customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Rappelé</p>
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                      {new Date(booking.remindedAt || booking.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Send Log */}
      {sentLog.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Journal des envois</h3>
          <div className="space-y-1.5">
            {sentLog.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {log.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="text-gray-600 dark:text-gray-400">Rappel {log.success ? 'envoyé' : 'échoué'} via {log.channel}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
