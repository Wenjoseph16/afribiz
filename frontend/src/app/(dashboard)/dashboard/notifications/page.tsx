'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ShoppingBag, Calendar, Wallet, Star, MessageCircle, Shield, Megaphone, Trash2, Settings } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNotifications, useUnreadCount, useMarkAllNotificationsRead, useDeleteNotification, useNotificationPreferences, useUpdateNotificationPreferences } from '@/features/hooks';

const iconMap: Record<string, React.ComponentType<any>> = {
  ORDER_PLACED: ShoppingBag, ORDER_CONFIRMED: ShoppingBag, ORDER_PREPARING: ShoppingBag,
  ORDER_SHIPPED: ShoppingBag, ORDER_DELIVERED: ShoppingBag, ORDER_CANCELLED: ShoppingBag,
  BOOKING_CONFIRMED: Calendar, BOOKING_REMINDER: Calendar, BOOKING_CANCELLED: Calendar,
  PAYMENT_RECEIVED: Wallet, PAYMENT_REMINDER: Wallet, PAYMENT_REFUNDED: Wallet,
  REVIEW_RESPONSE: Star, NEW_MESSAGE: MessageCircle, PROMOTION: Megaphone,
  NEW_EVENT: Calendar, SECURITY_ALERT: Shield, DISPUTE_OPENED: Shield,
  DISPUTE_RESOLVED: Shield, SYSTEM: Bell,
};

const colorMap: Record<string, string> = {
  ORDER_PLACED: 'bg-emerald-50 text-emerald-700', ORDER_CONFIRMED: 'bg-emerald-50 text-emerald-700',
  ORDER_PREPARING: 'bg-indigo-50 text-indigo-700', ORDER_SHIPPED: 'bg-purple-50 text-purple-700',
  ORDER_DELIVERED: 'bg-emerald-50 text-emerald-700', ORDER_CANCELLED: 'bg-red-50 text-red-700',
  BOOKING_CONFIRMED: 'bg-blue-50 text-blue-700', BOOKING_REMINDER: 'bg-amber-50 text-amber-700',
  BOOKING_CANCELLED: 'bg-red-50 text-red-700', PAYMENT_RECEIVED: 'bg-emerald-50 text-emerald-700',
  PAYMENT_REMINDER: 'bg-amber-50 text-amber-700', PAYMENT_REFUNDED: 'bg-teal-50 text-teal-700',
  REVIEW_RESPONSE: 'bg-amber-50 text-amber-700', NEW_MESSAGE: 'bg-indigo-50 text-indigo-700',
  PROMOTION: 'bg-orange-50 text-orange-700', NEW_EVENT: 'bg-blue-50 text-blue-700',
  SECURITY_ALERT: 'bg-red-50 text-red-700', DISPUTE_OPENED: 'bg-orange-50 text-orange-700',
  DISPUTE_RESOLVED: 'bg-emerald-50 text-emerald-700', SYSTEM: 'bg-gray-50 text-gray-700',
};

const typeLabels: Record<string, string> = {
  ORDER_PLACED: 'Commande', ORDER_CONFIRMED: 'Commande', ORDER_SHIPPED: 'Commande',
  ORDER_DELIVERED: 'Commande', ORDER_CANCELLED: 'Commande', BOOKING_CONFIRMED: 'Réservation',
  BOOKING_REMINDER: 'Rappel', PAYMENT_RECEIVED: 'Paiement', PAYMENT_REMINDER: 'Rappel',
  PAYMENT_REFUNDED: 'Remboursement', NEW_MESSAGE: 'Message', PROMOTION: 'Promotion',
  SECURITY_ALERT: 'Sécurité', DISPUTE_OPENED: 'Litige', SYSTEM: 'Système',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [showPreferences, setShowPreferences] = useState(false);

  const { data, isLoading, error, refetch } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const { data: prefsData } = useNotificationPreferences();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const updatePrefs = useUpdateNotificationPreferences();

  const notifications = data?.notifications || [];
  const unread = unreadCount ?? 0;
  const preferences = prefsData || [];

  const markAllReadHandler = () => markAllRead.mutate();
  const deleteHandler = (id: string) => deleteNotif.mutate(id);

  const handleNotificationClick = useCallback((notif: any) => {
    if (notif.link) router.push(notif.link);
  }, [router]);

  const togglePref = (type: string, channel: string) => {
    const newPrefs = preferences.map((p: any) =>
      p.type === type && p.channel === channel ? { ...p, enabled: !p.enabled } : p
    );
    const changed = newPrefs
      .filter((p: any) => p.type === type && p.channel === channel)
      .map((p: any) => ({ type: p.type, channel: p.channel, enabled: p.enabled }));
    if (changed.length) updatePrefs.mutate(changed);
  };

  const channelPrefs = ['IN_APP', 'EMAIL', 'SMS'].map((channel) => {
    const prefsForChannel = preferences.filter((p: any) => p.channel === channel);
    return { channel, enabled: prefsForChannel.some((p: any) => p.enabled), count: prefsForChannel.length };
  });

  const uniqueTypes = [...new Set(preferences.map((p: any) => p.type))] as string[];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} notification(s) non lue(s)` : 'Aucune nouvelle notification'}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllReadHandler}>
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Tout marquer comme lu
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowPreferences(!showPreferences)}>
              <Settings className="h-4 w-4 mr-1.5" />
              Préférences
            </Button>
          </div>
        }
      />

      {showPreferences ? (
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Canaux de réception</h3>
            <div className="space-y-3">
              {channelPrefs.map(({ channel, enabled, count }) => (
                <label key={channel} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{channel === 'IN_APP' ? 'Dans l\'app' : channel === 'EMAIL' ? 'Email' : 'SMS'}</p>
                    <p className="text-xs text-gray-500">{count} type(s) de notification</p>
                  </div>
                  <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', enabled ? 'bg-brand-50 text-brand' : 'bg-gray-100 text-gray-500')}>
                    {enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Types de notifications</h3>
            <div className="space-y-3">
              {uniqueTypes.map((type) => {
                const typePrefs = preferences.filter((p: any) => p.type === type);
                const enabled = typePrefs.some((p: any) => p.enabled);
                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{typeLabels[type] || type}</p>
                      <p className="text-xs text-gray-500">
                        {typePrefs.filter((p: any) => p.enabled).map((p: any) => p.channel).join(', ') || 'Aucun canal'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {typePrefs.map((p: any) => (
                        <button
                          key={`${p.type}-${p.channel}`}
                          onClick={() => togglePref(p.type, p.channel)}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full border transition-colors font-medium',
                            p.enabled
                              ? 'bg-brand-50 text-brand border-brand/20'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          )}
                        >
                          {p.channel === 'IN_APP' ? 'Appli' : p.channel === 'EMAIL' ? 'Email' : 'SMS'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="Aucune notification" description="Vous recevrez ici les mises à jour de vos commandes, réservations et activités." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                className={cn('flex items-start gap-4 p-4 rounded-xl border transition-colors', notif.link ? 'cursor-pointer hover:shadow-sm' : '', notif.read ? 'bg-white border-gray-200' : 'bg-brand-50/30 border-brand/10')}>
                <div className={cn('p-2.5 rounded-lg shrink-0', colorMap[notif.type] || 'bg-gray-50 text-gray-600')}>
                  {Icon && <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn('text-sm', notif.read ? 'text-gray-900' : 'text-gray-900 font-semibold')}>{notif.title}</p>
                      {notif.description && <p className="text-xs text-gray-500 mt-0.5">{notif.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-brand" />}
                      <button onClick={(e) => { e.stopPropagation(); deleteHandler(notif.id); }} className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">{new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
