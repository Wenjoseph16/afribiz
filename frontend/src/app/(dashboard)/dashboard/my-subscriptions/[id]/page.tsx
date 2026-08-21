'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RefreshCw,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { formatPrice } from '@/utils/helpers';
import { TransactionProgress } from '@/components/transactions';

const STATUS_CONFIG: Record<string, { label: string; color: string; banner: string; icon: any }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  ACTIVE: {
    label: 'Actif',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle,
  },
  PAUSE: {
    label: 'En pause',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  EXPIRED: {
    label: 'Expiré',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
  RENEWED: {
    label: 'Renouvelé',
    color: 'bg-violet-100 text-violet-700',
    banner:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-800 dark:text-violet-300',
    icon: RefreshCw,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'Abonnement en attente',
    description: 'Votre abonnement est en cours de validation',
  },
  ACTIVE: { title: 'Abonnement actif', description: 'Vous profitez de votre abonnement' },
  PAUSE: {
    title: 'Abonnement en pause',
    description: 'Votre abonnement est temporairement suspendu',
  },
  EXPIRED: { title: 'Abonnement expiré', description: 'Votre abonnement a expiré, renouvelez-le' },
  CANCELLED: { title: 'Abonnement annulé', description: 'Votre abonnement a été annulé' },
  RENEWED: {
    title: 'Abonnement renouvelé',
    description: 'Votre abonnement a été renouvelé avec succès',
  },
};

const CANCELLABLE_STATUSES = ['PENDING', 'ACTIVE'];

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const { data: transaction } = useTransactionDetail('SUBSCRIPTION', id);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/subscriptions/my/${id}`);
      setSubscription(res.data.data);
    } catch (e: any) {
      setError(e.message || 'Abonnement non trouvé');
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
  useTransactionSocket('SUBSCRIPTION', id, handleSocketUpdate);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await apiClient.post(`/subscriptions/my/${id}/cancel`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
    setCancelLoading(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (error || !subscription)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{error || 'Abonnement non trouvé'}</p>
      </div>
    );

  const sub: any = subscription;
  const plan = sub.plan || sub.planDetails || sub;
  const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const statusMsg = STATUS_MESSAGES[sub.status] || STATUS_MESSAGES.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(sub.status);
  const startDate = sub.startDate ? new Date(sub.startDate) : null;
  const nextBilling = sub.nextBillingDate ? new Date(sub.nextBillingDate) : null;
  const price = Number(sub.price || plan?.price || 0);
  const benefits = sub.benefits || plan?.benefits || [];

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
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
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {plan?.name || sub.title || `Abonnement #${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatPrice(price)} FCFA/{sub.billingCycle || plan?.billingCycle || 'mois'}
                    {startDate && <> · Depuis le {startDate.toLocaleDateString('fr-FR')}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {transaction && (
            <TransactionProgress
              type="SUBSCRIPTION"
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm" onClick={handleCancel} isLoading={cancelLoading}>
            <XCircle className="h-4 w-4 mr-1.5" />
            Annuler l&apos;abonnement
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
                  <DollarSign className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Coût</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(price)} <span className="text-xs font-normal">FCFA</span>
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cycle</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {sub.billingCycle || plan?.billingCycle || 'Mensuel'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Début</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {startDate
                      ? startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prochaine fact.</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {nextBilling
                      ? nextBilling.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {benefits.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Avantages du plan
              </h3>
              <ul className="space-y-2">
                {benefits.map((b: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Détails</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className={cn('font-medium px-2 py-0.5 rounded-full text-xs', status.color)}>
                  {status.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Début</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {startDate ? startDate.toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              {nextBilling && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Prochaine fact.</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {nextBilling.toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {sub.payments && sub.payments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                Derniers paiements
              </h3>
              <div className="space-y-2">
                {sub.payments.slice(0, 5).map((pay: any) => (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-xs text-gray-500">
                        {new Date(pay.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(Number(pay.amount))} FCFA
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
