'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Ticket,
  Clock,
  MapPin,
  Store,
  Download,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
  CheckCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { TransactionProgress } from '@/components/transactions';
import { downloadICS } from '@/lib/calendarSync';
import { printTicket, downloadTicketAsHTML } from '@/lib/downloadTicket';

const STATUS_CONFIG: Record<string, { label: string; color: string; banner: string; icon: any }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  REGISTERED: {
    label: 'Inscrit',
    color: 'bg-blue-100 text-blue-700',
    banner:
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Confirmé',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle,
  },
  ATTENDED: {
    label: 'Participant',
    color: 'bg-violet-100 text-violet-700',
    banner:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-800 dark:text-violet-300',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
  NO_SHOW: {
    label: 'No-show',
    color: 'bg-rose-100 text-rose-700',
    banner:
      'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
    icon: XCircle,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'Inscription en attente',
    description: 'Votre inscription est en cours de traitement',
  },
  REGISTERED: { title: "Inscrit à l'événement", description: 'Vous êtes inscrit, à bientôt !' },
  CONFIRMED: { title: 'Inscription confirmée', description: 'Votre place est garantie' },
  ATTENDED: { title: 'Événement terminé', description: "Merci d'avoir participé !" },
  CANCELLED: { title: 'Inscription annulée', description: 'Votre inscription a été annulée' },
  NO_SHOW: { title: 'Non présenté', description: 'Vous ne vous êtes pas présenté(e)' },
};

const CANCELLABLE_STATUSES = ['PENDING', 'REGISTERED', 'CONFIRMED'];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [participant, setParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: transaction } = useTransactionDetail('EVENT', id);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/events/my/${id}`);
      setParticipant(res.data.data);
    } catch (e: any) {
      setError(e.message || 'Événement non trouvé');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSocketUpdate = useCallback(() => {
    fetchData();
  }, [fetchData]);
  useTransactionSocket('EVENT', id, handleSocketUpdate);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (error || !participant)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{error || 'Événement non trouvé'}</p>
      </div>
    );

  const p: any = participant;
  const event = p.event || p;
  const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const eventDate = event.startDate ? new Date(event.startDate) : null;
  const eventEndDate = event.endDate ? new Date(event.endDate) : null;
  const businessName = event.business?.name || '—';
  const statusMsg = STATUS_MESSAGES[p.status] || STATUS_MESSAGES.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(p.status);
  const hasQR = !!p.qrCode;

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl', status.color)}>
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {event.title || `#${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {eventDate &&
                      eventDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    {eventEndDate &&
                      eventEndDate.toLocaleDateString('fr-FR') !==
                        eventDate?.toLocaleDateString('fr-FR') && (
                        <>
                          {' '}
                          →{' '}
                          {eventEndDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    {businessName !== '—' && <> · {businessName}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {transaction && (
            <TransactionProgress
              type="EVENT"
              progress={transaction.progress || 0}
              label="Progression"
              size="lg"
            />
          )}
        </div>
        <div className={cn('flex items-center gap-3 p-4 border', status.banner)}>
          <StatusIcon className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{statusMsg.title}</p>
            <p className="text-xs opacity-80">{statusMsg.description}</p>
          </div>
        </div>
      </div>

      {/* QR Code Ticket */}
      {hasQR && (
        <Card className="p-6 text-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Mon billet
          </h3>
          <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
            <img src={p.qrCode} alt="QR Code" className="w-56 h-56 mx-auto" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 font-mono">
            Réf: {p.ticketNumber || p.id?.slice(0, 12)}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                printTicket({
                  title: event.title || '',
                  number: p.ticketNumber || p.id?.slice(0, 12) || '',
                  date: eventDate ? eventDate.toLocaleDateString('fr-FR') : '',
                  time: eventDate
                    ? eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : undefined,
                  location: event.location || undefined,
                  businessName: businessName !== '—' ? businessName : undefined,
                  qrCodeUrl: p.qrCode,
                  type: 'event',
                })
              }
            >
              <Download className="h-4 w-4 mr-1.5" />
              Imprimer le billet
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadTicketAsHTML({
                  title: event.title || '',
                  number: p.ticketNumber || p.id?.slice(0, 12) || '',
                  date: eventDate ? eventDate.toLocaleDateString('fr-FR') : '',
                  time: eventDate
                    ? eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : undefined,
                  location: event.location || undefined,
                  businessName: businessName !== '—' ? businessName : undefined,
                  qrCodeUrl: p.qrCode,
                  type: 'event',
                })
              }
            >
              Sauvegarder
            </Button>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            downloadICS(
              {
                title: event.title || '',
                description: event.description || undefined,
                location: event.location || undefined,
                startDate: eventDate || new Date(),
                endDate: eventEndDate || undefined,
                businessName: businessName !== '—' ? businessName : undefined,
              },
              `event_${id}.ics`
            )
          }
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Ajouter au calendrier
        </Button>
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter l&apos;organisateur
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm">
            <XCircle className="h-4 w-4 mr-1.5" />
            Annuler l&apos;inscription
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10">
                  <Calendar className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {eventDate
                      ? eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Horaire</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {eventDate
                      ? eventDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lieu</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {event.location || '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Participants</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {event.participantCount || '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {event.description && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {event.description}
              </p>
            </Card>
          )}

          {event.category && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Détails</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Catégorie</span>
                  <p className="font-medium text-gray-900 dark:text-white">{event.category}</p>
                </div>
                {event.price && (
                  <div>
                    <span className="text-gray-500">Prix</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {Number(event.price).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              Organisateur
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-white">{businessName}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              Mon inscription
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={cn('font-medium px-2 py-0.5 rounded-full text-xs', status.color)}>
                  {status.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inscrit le</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
