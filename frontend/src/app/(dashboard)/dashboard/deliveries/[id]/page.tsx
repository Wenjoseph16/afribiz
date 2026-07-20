'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Pencil,
  Package,
  MapPin,
  Phone,
  User,
  CalendarDays,
  Loader,
  History,
  TrendingUp,
  Activity,
  CheckCircle2,
  Play,
  XCircle,
  Truck,
  Camera,
  Signature,
  Clock,
  UserCheck,
  Lock,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  useDelivery,
  useUpdateDeliveryStatus,
  useDrivers,
  useAssignDriver,
} from '@/features/hooks';

type DetailTab = 'info' | 'history';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  ASSIGNED: 'Assigné',
  in_transit: 'En transit',
  IN_TRANSIT: 'En transit',
  delivered: 'Livré',
  DELIVERED: 'Livré',
  cancelled: 'Annulé',
  CANCELLED: 'Annulé',
};

const STATUS_BG: Record<string, string> = {
  pending: 'bg-amber-500/30 text-white',
  ASSIGNED: 'bg-blue-500/30 text-white',
  in_transit: 'bg-blue-500/30 text-white',
  IN_TRANSIT: 'bg-blue-500/30 text-white',
  delivered: 'bg-emerald-500/30 text-white',
  DELIVERED: 'bg-emerald-500/30 text-white',
  cancelled: 'bg-red-500/30 text-white',
  CANCELLED: 'bg-red-500/30 text-white',
};

export default function DeliveryDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: delivery, isLoading, error, refetch } = useDelivery(id);
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(
    null
  );
  const [confirmCancel, setConfirmCancel] = useState(false);

  const updateStatus = useUpdateDeliveryStatus();
  const { data: drivers } = useDrivers();
  const assignDriver = useAssignDriver();

  const nextStatus = (
    current: string
  ): { status: string; label: string; icon: any; color: string } | null => {
    switch (current) {
      case 'pending':
        return { status: 'ASSIGNED', label: 'Démarrer la livraison', icon: Play, color: 'emerald' };
      case 'ASSIGNED':
        return { status: 'IN_TRANSIT', label: 'Marquer en transit', icon: Truck, color: 'blue' };
      case 'IN_TRANSIT':
        return {
          status: 'DELIVERED',
          label: 'Marquer livrée',
          icon: CheckCircle2,
          color: 'emerald',
        };
      default:
        return null;
    }
  };

  if (!params?.id) return null;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (!delivery)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Livraison introuvable</p>
      </div>
    );

  const now = new Date();
  const d: any = delivery;
  const createdDate = d.createdAt ? new Date(d.createdAt) : null;
  const action = nextStatus(d.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/deliveries"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          {!d.driver && (
            <Button size="sm" variant="outline" onClick={() => setShowAssignDriver(true)}>
              <UserCheck className="h-4 w-4 mr-1.5" />
              Assigner un chauffeur
            </Button>
          )}
          <Link href={`/dashboard/deliveries/${id}/edit`}>
            <Button size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-1.5" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{d.recipientName}</h1>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {d.recipientAddress}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {d.recipientPhone}
              </div>
              {d.driver && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Chauffeur : {d.driver.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {d.createdAt &&
              new Date(d.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">
                  🆕 Nouveau
                </span>
              )}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                STATUS_BG[d.status] || 'bg-gray-500/30'
              )}
            >
              {STATUS_LABELS[d.status] || d.status}
            </span>
            {action && (
              <button
                onClick={() => setConfirmAction(action)}
                disabled={updateStatus.isPending}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  'bg-white/20 hover:bg-white/30 text-white border border-white/30',
                  updateStatus.isPending && 'opacity-60 cursor-not-allowed'
                )}
              >
                <action.icon className="h-3.5 w-3.5" />
                {updateStatus.isPending ? '...' : action.label}
              </button>
            )}
            {d.status !== 'CANCELLED' && d.status !== 'DELIVERED' && (
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/30 hover:bg-red-500/50 text-white border border-white/20 transition-all"
              >
                <XCircle className="h-3.5 w-3.5" />
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {(
          [
            { key: 'info', label: 'Informations', icon: Package },
            { key: 'history', label: 'Historique', icon: History },
          ] as { key: DetailTab; label: string; icon: any }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Articles
              </h3>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <Package className="h-5 w-5 text-brand mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {d.items || 'Aucun article spécifié'}
                </p>
              </div>
              {d.notes && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {d.notes}
                  </p>
                </>
              )}
            </Card>

            <div className="space-y-4">
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Destinataire
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {d.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    {d.recipientPhone}
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{d.recipientAddress}</span>
                  </div>
                </div>
                {d.latitude && d.longitude && (
                  <>
                    <div className="mt-3">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${d.latitude}&mlon=${d.longitude}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          Voir sur la carte
                        </Button>
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Lat: {d.latitude}, Lng: {d.longitude}
                    </p>
                  </>
                )}
              </Card>

              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Livraison
                </h3>
                <div className="space-y-3 text-sm">
                  {d.zone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Zone</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {d.zone.name}
                      </span>
                    </div>
                  )}
                  {d.driver && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chauffeur</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {d.driver.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        d.status === 'pending'
                          ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                          : d.status === 'in_transit'
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : d.status === 'delivered'
                              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                      )}
                    >
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </div>
                  {createdDate && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Créée le {createdDate.toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Tracking Timeline */}
          <Card padding="lg" className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand" />
              Suivi de livraison
            </h3>
            {d.tracking && d.tracking.length > 0 ? (
              <div className="space-y-0">
                {d.tracking.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4 pb-4 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full mt-1.5 z-10 ring-2 ring-white dark:ring-gray-800',
                          event.status === 'DELIVERED' || event.status === 'delivered'
                            ? 'bg-emerald-500'
                            : event.status === 'IN_TRANSIT' || event.status === 'in_transit'
                              ? 'bg-blue-500'
                              : event.status === 'ASSIGNED' || event.status === 'assigned'
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                        )}
                      />
                      {i < d.tracking.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_BG[event.status] || 'bg-gray-500/30 text-white'
                          )}
                        >
                          {STATUS_LABELS[event.status] || event.status}
                        </span>
                        {event.timestamp && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.timestamp).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {event.locationName && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {event.locationName}
                        </p>
                      )}
                      {event.lat && event.lng && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.lat}, {event.lng}
                        </p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin className="h-5 w-5" />
                <p className="text-sm">Aucun événement de suivi</p>
              </div>
            )}
          </Card>

          {/* Delivery Proofs */}
          <Card padding="lg" className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-brand" />
              Preuves de livraison
            </h3>
            {d.proofs && d.proofs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {d.proofs.map((proof: any, i: number) => (
                  <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1',
                          proof.type === 'SIGNATURE'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : proof.type === 'PHOTO'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : proof.type === 'PIN'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        )}
                      >
                        {proof.type === 'SIGNATURE' && <Signature className="h-3 w-3" />}
                        {proof.type === 'PHOTO' && <Camera className="h-3 w-3" />}
                        {proof.type === 'PIN' && <Lock className="h-3 w-3" />}
                        {proof.type}
                      </span>
                      {proof.verified !== undefined && (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            proof.verified ? 'text-emerald-600' : 'text-amber-600'
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {proof.verified ? 'Vérifié' : 'Non vérifié'}
                        </span>
                      )}
                    </div>
                    {proof.signatureUrl && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                        <Image
                          src={proof.signatureUrl}
                          alt="Signature"
                          width={300}
                          height={96}
                          className="max-h-24 w-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    {proof.photoUrl && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <Image
                          src={proof.photoUrl}
                          alt="Photo de livraison"
                          width={400}
                          height={160}
                          className="w-full h-40 object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    {proof.type === 'PIN' && proof.value && (
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {'•'.repeat(Math.max(proof.value.toString().length - 2, 0)) +
                          proof.value.toString().slice(-2)}
                      </p>
                    )}
                    {proof.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{proof.notes}</p>
                    )}
                    {proof.timestamp && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(proof.timestamp).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500">
                <Camera className="h-5 w-5" />
                <p className="text-sm">Aucune preuve de livraison</p>
              </div>
            )}

            {d.signatureUrl && (
              <div className="mt-4">
                <Image
                  src={d.signatureUrl}
                  alt="Signature"
                  width={400}
                  height={96}
                  className="max-h-24 w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  unoptimized
                />
              </div>
            )}
            {d.photoUrl && (
              <div className="mt-4">
                <Image
                  src={d.photoUrl}
                  alt="Photo de livraison"
                  width={400}
                  height={160}
                  className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  unoptimized
                />
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <CalendarDays className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date de création</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {createdDate
                      ? createdDate.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Destinataire</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {d.recipientName}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Zone</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {d.zone?.name || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Âge de la livraison</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {createdDate
                      ? (() => {
                          const diff = now.getTime() - createdDate.getTime();
                          const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                          if (days >= 30) return `${Math.floor(days / 30)} mois`;
                          return `${days} jour${days > 1 ? 's' : ''}`;
                        })()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Chronologie
            </h3>
            <div className="space-y-3">
              {[
                { date: createdDate, label: 'Livraison créée', icon: History },
                {
                  date: d.assignedAt ? new Date(d.assignedAt) : null,
                  label: 'Chauffeur assigné',
                  icon: User,
                },
                {
                  date: d.inTransitAt ? new Date(d.inTransitAt) : null,
                  label: 'En transit',
                  icon: TrendingUp,
                },
                {
                  date: d.deliveredAt ? new Date(d.deliveredAt) : null,
                  label: 'Livrée',
                  icon: CheckCircle2,
                },
                {
                  date: d.updatedAt ? new Date(d.updatedAt) : null,
                  label: 'Dernière modification',
                  icon: Pencil,
                },
              ]
                .filter((item) => item.date)
                .map((item, i, arr) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          i === 0
                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.date?.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Assigner un chauffeur
              </h3>
              <button
                onClick={() => setShowAssignDriver(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {!drivers || drivers.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Aucun chauffeur disponible</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {drivers.map((driver: any) => (
                  <button
                    key={driver.id}
                    onClick={() => {
                      assignDriver.mutate(
                        { id, data: { driverId: driver.id } },
                        {
                          onSuccess: () => setShowAssignDriver(false),
                        }
                      );
                    }}
                    disabled={assignDriver.isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-300 dark:hover:border-brand-700 transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                      <User className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {driver.name}
                      </p>
                      {driver.phone && <p className="text-xs text-gray-500">{driver.phone}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {assignDriver.isPending && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-brand">
                <Loader className="h-4 w-4 animate-spin" />
                Assignation en cours...
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (confirmAction) {
            await updateStatus.mutateAsync({ id, status: confirmAction.status });
            setConfirmAction(null);
          }
        }}
        title={`Passer cette livraison à "${confirmAction?.label}" ?`}
        description="Confirmez le changement de statut de cette livraison."
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="info"
      />
      <ConfirmationModal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={async () => {
          await updateStatus.mutateAsync({ id, status: 'CANCELLED' });
          setConfirmCancel(false);
        }}
        title="Annuler cette livraison ?"
        description="Cette action annulera la livraison. Cette décision est irréversible."
        confirmLabel="Annuler la livraison"
        cancelLabel="Retour"
        variant="danger"
      />
    </div>
  );
}
