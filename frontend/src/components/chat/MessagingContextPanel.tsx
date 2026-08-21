'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Package,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Building2,
  BadgeCheck,
  Star,
  ShoppingBag,
  Calendar,
  Check,
  Clock,
  Truck,
  Send,
  ChevronRight,
  Shield,
  PackageCheck,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

export type ContextTab = 'profile' | 'order' | 'client';

interface Props {
  conv: any;
  currentUserId?: string;
  orderId?: string;
  activeTab: ContextTab;
  onTabChange: (tab: ContextTab) => void;
  onClose: () => void;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-400', dot: 'bg-amber-400' },
  PROCESSING: { label: 'En préparation', color: 'text-blue-400', dot: 'bg-blue-400' },
  CONFIRMED: { label: 'Confirmée', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Terminée', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  DELIVERED: { label: 'Livrée', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  SHIPPED: { label: 'Expédiée', color: 'text-blue-400', dot: 'bg-blue-400' },
  CANCELLED: { label: 'Annulée', color: 'text-red-400', dot: 'bg-red-400' },
  REFUNDED: { label: 'Remboursée', color: 'text-gray-400', dot: 'bg-gray-400' },
};

function getStatus(status?: string) {
  return (
    STATUS_META[status || ''] || {
      label: status || 'Inconnu',
      color: 'text-gray-300',
      dot: 'bg-gray-400',
    }
  );
}

function fmtMoney(v: any, currency = 'FCFA') {
  const n = Number(v);
  if (!n) return '0 FCFA';
  return `${n.toLocaleString('fr-FR')} ${currency}`;
}

export default function MessagingContextPanel({
  conv,
  currentUserId,
  orderId,
  activeTab,
  onTabChange,
  onClose,
}: Props) {
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const otherUser = conv?.participants?.find((p: any) => p.id !== currentUserId);
  const convName =
    conv?.businessName || conv?.recipientName || otherUser?.name || conv?.name || 'Client';
  const avatar = conv?.otherUserAvatar || conv?.businessLogo || otherUser?.avatar || null;
  const initial = convName?.charAt(0)?.toUpperCase() || '?';
  const channel = conv?.channel || conv?.type || 'INTERNAL';

  useEffect(() => {
    if (activeTab !== 'order' || !orderId) {
      setOrder(null);
      setTimeline([]);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [o, t] = await Promise.all([
          apiClient.getOrder(orderId),
          apiClient.getOrderTimeline(orderId),
        ]);
        if (!active) return;
        setOrder(o?.data?.data || o?.data || null);
        setTimeline(t?.data?.data || t?.data || []);
      } catch {
        if (active) {
          setOrder(null);
          setTimeline([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeTab, orderId]);

  const tabs: { id: ContextTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Personne', icon: User },
    { id: 'order', label: 'Commande', icon: Package },
    { id: 'client', label: 'Client', icon: CreditCard },
  ];

  const timelineSteps = [
    { key: 'created', label: 'Commande créée', icon: ShoppingBag },
    { key: 'processing', label: 'En préparation', icon: Clock },
    { key: 'shipped', label: 'Expédiée', icon: Truck },
    { key: 'delivered', label: 'Livrée', icon: PackageCheck },
  ];

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 336, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="shrink-0 overflow-hidden border-l border-white/10 bg-white/[0.04] backdrop-blur-xl flex flex-col h-full"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-gray-100">Contexte</h3>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
          aria-label="Fermer le panneau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-white/10">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              type="button"
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-brand/20 text-brand ring-1 ring-brand/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ─── Profile tab ─── */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 space-y-4"
            >
              <button
                onClick={() => onTabChange('client')}
                type="button"
                className="w-full text-center group cursor-pointer"
              >
                <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-brand/40 group-hover:ring-brand/70 transition-all">
                  {avatar ? (
                    <Image src={avatar} alt="" fill className="object-cover" sizes="80px" />
                  ) : (
                    <span className="text-2xl">{initial}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <p className="mt-3 text-base font-bold text-gray-100 group-hover:text-brand transition-colors">
                  {convName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-brand" />
                  Client AfriBiz vérifié
                </p>
              </button>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Commandes',
                    value: (otherUser?.orderCount ?? conv?.orderCount ?? 0) as any,
                    icon: ShoppingBag,
                  },
                  {
                    label: 'Total dépensé',
                    value: fmtMoney(otherUser?.totalSpent ?? conv?.totalSpent),
                    icon: CreditCard,
                  },
                  {
                    label: 'Note',
                    value: otherUser?.rating ? otherUser.rating.toFixed(1) : '—',
                    icon: Star,
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center"
                    >
                      <Icon className="h-4 w-4 text-brand mx-auto mb-1" />
                      <p className="text-sm font-bold text-gray-100 truncate">{s.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/5">
                {[
                  {
                    icon: Mail,
                    label: 'Email',
                    value: otherUser?.email || conv?.email || 'Non renseigné',
                  },
                  {
                    icon: Phone,
                    label: 'Téléphone',
                    value: otherUser?.phone || conv?.phone || 'Non renseigné',
                  },
                  {
                    icon: MapPin,
                    label: 'Ville',
                    value: otherUser?.city || conv?.city || otherUser?.country || 'Non renseigné',
                  },
                  {
                    icon: Building2,
                    label: 'Entreprise',
                    value: conv?.businessName || 'Particulier',
                  },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-start gap-3 px-3 py-2.5">
                      <Icon className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                          {row.label}
                        </p>
                        <p className="text-xs text-gray-200 truncate">{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onTabChange('order')}
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand text-xs font-medium hover:bg-brand/20 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Voir les commandes
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* ─── Order tab ─── */}
          {activeTab === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 space-y-4"
            >
              {!orderId ? (
                <div className="text-center py-10">
                  <Package className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Aucune commande liée à cette conversation.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : order ? (
                <>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Réf.{' '}
                        <span className="text-gray-200 font-semibold">
                          {order.orderNumber || order.id}
                        </span>
                      </p>
                      <span className={cn('text-xs font-semibold', getStatus(order.status).color)}>
                        {getStatus(order.status).label}
                      </span>
                    </div>
                    {order.createdAt && (
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/5">
                    {(order.items || []).length > 0 ? (
                      order.items.map((it: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            {it.image ? (
                              <Image
                                src={it.image}
                                alt=""
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-100 truncate">
                              {it.name || it.product?.name || `Article ${i + 1}`}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {it.quantity ? `x${it.quantity}` : ''} ·{' '}
                              {fmtMoney(it.price, order.currency)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : order.description ? (
                      <div className="px-3 py-2.5 text-xs text-gray-300">{order.description}</div>
                    ) : (
                      <div className="px-3 py-2.5 text-xs text-gray-500">
                        Aucun article détaillé
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Montant total</span>
                      <span className="font-bold text-gray-100">
                        {fmtMoney(order.total || order.totalAmount, order.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-emerald-400" /> Paiement
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          order.paymentStatus === 'PAID' || order.paid
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        )}
                      >
                        {order.paymentStatus === 'PAID' || order.paid ? 'Payé' : 'En attente'}
                      </span>
                    </div>
                    {order.paymentMethod && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Méthode</span>
                        <span className="text-gray-300">{order.paymentMethod}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">
                      Suivi de la commande
                    </p>
                    <div className="space-y-3">
                      {timelineSteps.map((step, i) => {
                        const done =
                          order.status === 'COMPLETED' ||
                          order.status === 'DELIVERED' ||
                          order.status === 'SHIPPED' ||
                          i === 0 ||
                          (i === 1 &&
                            [
                              'PROCESSING',
                              'CONFIRMED',
                              'COMPLETED',
                              'DELIVERED',
                              'SHIPPED',
                            ].includes(order.status)) ||
                          (i === 2 &&
                            ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status)) ||
                          (i === 3 && ['DELIVERED', 'COMPLETED'].includes(order.status));
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                                done
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-white/5 text-gray-600'
                              )}
                            >
                              {done ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Icon className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div>
                              <p
                                className={cn(
                                  'text-xs font-medium',
                                  done ? 'text-gray-200' : 'text-gray-500'
                                )}
                              >
                                {step.label}
                              </p>
                              {timeline.length > 0 &&
                                i < timeline.length &&
                                timeline[i]?.createdAt && (
                                  <p className="text-[10px] text-gray-600">
                                    {new Date(timeline[i].createdAt).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </p>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-500">Commande introuvable ou accès refusé.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Client tab ─── */}
          {activeTab === 'client' && (
            <motion.div
              key="client"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 space-y-4"
            >
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">
                  Abonnements actifs
                </p>
                {(conv?.subscriptions || []).length > 0 ? (
                  conv.subscriptions.map((s: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-t border-white/5 first:border-0"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-200">
                          {s.name || s.plan || 'Abonnement'}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Échéance :{' '}
                          {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                        {s.status || 'Actif'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-2 text-center">Aucun abonnement actif</p>
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">
                  Historique récent
                </p>
                {(conv?.recentOrders || []).length > 0 ? (
                  conv.recentOrders.map((o: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => onTabChange('order')}
                      type="button"
                      className="w-full flex items-center justify-between py-2 border-t border-white/5 first:border-0 hover:bg-white/5 transition-colors rounded-lg px-1"
                    >
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-200">
                          {o.orderNumber || `Commande`}
                        </p>
                        <p className="text-[10px] text-gray-500">{fmtMoney(o.total, o.currency)}</p>
                      </div>
                      <span className={cn('text-[10px] font-medium', getStatus(o.status).color)}>
                        {getStatus(o.status).label}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-2 text-center">Aucun historique</p>
                )}
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
                  Canal de contact
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                    <Send className="h-3 w-3" />
                    {channel === 'WHATSAPP' ? 'Pont WhatsApp' : 'Chat AfriBiz'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
