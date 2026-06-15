'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Store, DollarSign, CheckCircle, XCircle, Loader, History, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useBooking } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ARRIVED: { label: 'Arrivé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  IN_PROGRESS: { label: 'En cours', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  NO_SHOW: { label: 'No-show', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  RESCHEDULED: { label: 'Reportée', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

export default function BookingDetailPage() {
  const params = useParams();
  const qc = useQueryClient();
  const id = params?.id as string;
  const { data: bookingData, isLoading } = useBooking(id);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const b: any = bookingData?.booking || bookingData || {};

  const handleCancel = async () => {
    if (!b.id) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/bookings/${b.id}/cancel`, { reason: cancelReason });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setCancelModalOpen(false);
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!b || !b.id) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Réservation non trouvée</p></div>;

  const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
  const startDate = new Date(b.startDate || b.date);
  const endDate = b.endDate ? new Date(b.endDate) : null;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(b.status);
  const businessName = b.business?.name || b.businessName || '—';

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{b.bookingNumber || `#${b.id.slice(0, 8)}`}</h1>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.color)}>{status.label}</span>
          </div>
          <p className="text-sm text-gray-500">{b.title}</p>
        </div>
        {canCancel && (
          <Button variant="secondary" size="sm" onClick={() => setCancelModalOpen(true)} className="text-red-500 hover:text-red-600"><XCircle className="w-4 h-4 mr-1.5" />Annuler</Button>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand/10"><DollarSign className="w-4 h-4 text-brand" /></div><div><p className="text-xs text-gray-500">Montant</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(Number(b.price || 0))}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Calendar className="w-4 h-4 text-blue-600" /></div><div><p className="text-xs text-gray-500">Date</p><p className="text-lg font-bold text-gray-900 dark:text-white text-sm">{startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Clock className="w-4 h-4 text-purple-600" /></div><div><p className="text-xs text-gray-500">Horaire</p><p className="text-lg font-bold text-gray-900 dark:text-white text-sm">{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}{endDate && ` - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Store className="w-4 h-4 text-amber-600" /></div><div><p className="text-xs text-gray-500">Entreprise</p><p className="text-lg font-bold text-gray-900 dark:text-white text-sm truncate">{businessName}</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Type</span><p className="font-medium text-gray-900 dark:text-white">{b.type || '—'}</p></div>
              <div><span className="text-gray-500">Début</span><p className="font-medium text-gray-900 dark:text-white">{startDate.toLocaleString('fr-FR')}</p></div>
              <div><span className="text-gray-500">Fin</span><p className="font-medium text-gray-900 dark:text-white">{endDate ? endDate.toLocaleString('fr-FR') : '—'}</p></div>
              <div><span className="text-gray-500">Personnes</span><p className="font-medium text-gray-900 dark:text-white">{b.guests || b.adults || 1}{b.children ? ` (dont ${b.children} enfants)` : ''}</p></div>
            </div>
            {b.specialRequests && <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800"><p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Demande spéciale</p><p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">{b.specialRequests}</p></div>}
          </Card>

          {/* Payment */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Paiement</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-sm text-gray-600 dark:text-gray-400">Montant total</span><span className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(b.price || 0))}</span></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-sm text-gray-600 dark:text-gray-400">Acompte</span><span className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(b.depositAmount || 0))}</span></div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg"><span className="text-sm text-emerald-600 dark:text-emerald-400">Acompte payé</span>{b.depositPaid ? <span className="text-emerald-600 font-medium">✓ Oui</span> : <span className="text-amber-600">Non</span>}</div>
            </div>
          </Card>

          {/* Timeline & Historique */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <History className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Créée le</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Activity className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Dernière act.</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{b.updatedAt ? new Date(b.updatedAt).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <TrendingUp className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{b.source || 'Dashboard'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Durée</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{endDate ? `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))}h` : '—'}</p>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chronologie</h4>
            <div className="space-y-3 text-sm">
              {[{ label: 'Réservation créée', time: b.createdAt }, { label: 'Statut actuel: ' + status.label, time: b.updatedAt }].filter(x => x.time).map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-brand shrink-0" />
                  <div><p className="font-medium text-gray-900 dark:text-white">{e.label}</p><p className="text-xs text-gray-400">{new Date(e.time).toLocaleString('fr-FR')}</p></div>
                </div>
              ))}
              {b.checkedInAt && <div className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" /><div><p className="font-medium text-emerald-600">Arrivé(e)</p><p className="text-xs text-gray-400">{new Date(b.checkedInAt).toLocaleString('fr-FR')}</p></div></div>}
              {b.checkedOutAt && <div className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" /><div><p className="font-medium text-blue-600">Terminée</p><p className="text-xs text-gray-400">{new Date(b.checkedOutAt).toLocaleString('fr-FR')}</p></div></div>}
              {b.cancelledAt && <div className="flex items-start gap-3"><div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" /><div><p className="font-medium text-red-600">Annulée{b.cancelReason ? `: ${b.cancelReason}` : ''}</p><p className="text-xs text-gray-400">{new Date(b.cancelledAt).toLocaleString('fr-FR')}</p></div></div>}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Business Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Entreprise</h3>
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-white">{businessName}</span>
            </div>
          </Card>

          {b.service && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Service associé</h3>
              <p className="text-sm font-medium">{b.service.name}</p>
              {b.service.price && <p className="text-xs text-gray-500 mt-1">{formatPrice(Number(b.service.price))}</p>}
              {b.service.duration && <p className="text-xs text-gray-500">{b.service.duration} min</p>}
            </Card>
          )}

          {b.resource && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Ressource</h3>
              <p className="text-sm font-medium">{b.resource.name}</p>
              <p className="text-xs text-gray-500 mt-1">{b.resource.type}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Annuler la réservation" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Voulez-vous vraiment annuler cette réservation ?</p>
          <div>
            <label className="block text-sm font-medium mb-1">Motif d'annulation</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100" rows={3} placeholder="Optionnel..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>Retour</Button>
            <Button onClick={handleCancel} isLoading={actionLoading} className="bg-red-500 hover:bg-red-600">Confirmer l'annulation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
