'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Handshake,
  Check,
  X,
  RefreshCcw,
  MessageSquareText,
  Phone,
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useMyBusiness } from '@/features/hooks/business';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: {
    label: 'En attente',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  COUNTERED: {
    label: 'Contre-proposée',
    cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  },
  ACCEPTED: {
    label: 'Acceptée',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  DECLINED: {
    label: 'Refusée',
    cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
  COMPLETED: {
    label: 'Commandée',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  EXPIRED: {
    label: 'Expirée',
    cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  },
};

const STATUS_ORDER: Record<string, number> = {
  COUNTERED: 0,
  PENDING: 1,
  ACCEPTED: 2,
  COMPLETED: 3,
  EXPIRED: 4,
  DECLINED: 5,
};

export default function NegotiationsPage() {
  const queryClient = useQueryClient();
  const { data: myBusiness } = useMyBusiness();
  const businessId = myBusiness?.id;

  const [counterOffer, setCounterOffer] = useState<any | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [acceptedLink, setAcceptedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    data: offers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['negotiations', businessId],
    queryFn: async () => {
      const res = await apiClient.listNegotiations(businessId ? { businessId } : undefined);
      return (res.data?.data || []) as any[];
    },
    enabled: !!businessId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['negotiations'] });
  };

  const accept = useMutation({
    mutationFn: (id: string) => apiClient.acceptNegotiation(id),
    onSuccess: (res: any) => {
      const data = res?.data?.data;
      setAcceptedLink(data?.link || null);
      invalidate();
    },
  });

  const decline = useMutation({
    mutationFn: (id: string) => apiClient.declineNegotiation(id),
    onSuccess: () => invalidate(),
  });

  const sendCounter = useMutation({
    mutationFn: (id: string) =>
      apiClient.counterNegotiation(id, Number(counterPrice), counterMessage || undefined),
    onSuccess: () => {
      setCounterOffer(null);
      setCounterPrice('');
      setCounterMessage('');
      invalidate();
    },
  });

  const sorted = useMemo(() => {
    if (!offers) return [];
    return [...offers].sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
    );
  }, [offers]);

  const pendingCount = (offers || []).filter(
    (o) => o.status === 'PENDING' || o.status === 'COUNTERED'
  ).length;

  const copyLink = async () => {
    if (!acceptedLink) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + acceptedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Négociations"
        description="Les clients proposent un prix sur vos articles. Répondez vite : l'offre part en 48 h."
        badge={
          pendingCount > 0
            ? {
                label: `${pendingCount} à traiter`,
                className: 'bg-amber-50 text-amber-700 border-amber-200',
              }
            : undefined
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/business' },
          { label: 'Négociations' },
        ]}
        actions={
          <button
            onClick={() => invalidate()}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Actualiser
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
          Impossible de charger les négociations. Réessayez.
        </div>
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <EmptyState
          icon={<Handshake className="w-10 h-10 text-gray-300 dark:text-gray-600" />}
          title="Aucune offre de négociation"
          description="Quand un client proposera un prix sur un de vos articles, l'offre apparaîtra ici. Activez la négociation sur un produit pour commencer."
        />
      )}

      <div className="space-y-4">
        {sorted.map((o) => {
          const meta = STATUS_META[o.status] || STATUS_META.PENDING;
          const open = o.status === 'PENDING' || o.status === 'COUNTERED';
          const agreed = o.status === 'ACCEPTED' || o.status === 'COMPLETED' ? o.agreedPrice : null;
          const askedPrice =
            o.status === 'COUNTERED' && o.counterPrice != null ? o.counterPrice : o.proposedPrice;
          return (
            <Card key={o.id} padding="lg" className="overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {o.itemName}
                    </h3>
                    <Badge className={cn('border', meta.cls)}>{meta.label}</Badge>
                    {o.expiresInHours != null && o.status === 'ACCEPTED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" /> expire dans {o.expiresInHours} h
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-2 flex-wrap">
                    <span className="text-gray-400 line-through">{formatPrice(o.basePrice)}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatPrice(askedPrice)}
                    </span>
                    {agreed != null && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ accordé {formatPrice(agreed)}
                      </span>
                    )}
                  </div>
                  {o.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">
                      « {o.message} »
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {o.clientName && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquareText className="w-3.5 h-3.5" /> {o.clientName}
                      </span>
                    )}
                    {o.clientPhone && (
                      <a
                        href={`https://wa.me/${String(o.clientPhone).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-brand"
                      >
                        <Phone className="w-3.5 h-3.5" /> {o.clientPhone}
                      </a>
                    )}
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>
                      {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {open && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => accept.mutate(o.id)}
                      disabled={accept.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4" /> Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCounterOffer(o);
                        setCounterPrice(String(o.counterPrice ?? o.proposedPrice));
                        setCounterMessage('');
                      }}
                    >
                      <RefreshCcw className="w-4 h-4" /> Contre-proposer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => decline.mutate(o.id)}
                      disabled={decline.isPending}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" /> Refuser
                    </Button>
                  </div>
                )}
              </div>

              {o.orderId && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
                  <Link
                    href={`/dashboard/business/orders/${o.orderId}`}
                    className="inline-flex items-center gap-1.5 text-brand hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" /> Voir la commande issue de la négociation
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal contre-proposition */}
      <Modal
        open={!!counterOffer}
        onClose={() => setCounterOffer(null)}
        title="Contre-proposer un prix"
        description={
          counterOffer
            ? `${counterOffer.itemName} — le client propose ${formatPrice(counterOffer.proposedPrice)}.`
            : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Votre prix (FCFA)
            </label>
            <Input
              type="number"
              min={1}
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              placeholder={counterOffer ? `Moins de ${counterOffer.basePrice}` : ''}
            />
            {counterOffer && Number(counterPrice) >= Number(counterOffer.basePrice) && (
              <p className="text-xs text-red-500 mt-1">
                Doit être inférieur au prix affiché ({formatPrice(counterOffer.basePrice)})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Message au client (optionnel)
            </label>
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              rows={2}
              placeholder="Ex : je peux vous faire ce prix si vous prenez deux articles…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setCounterOffer(null)}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-brand hover:bg-brand-700 text-white"
              disabled={
                !counterOffer ||
                !Number(counterPrice) ||
                Number(counterPrice) >= Number(counterOffer.basePrice) ||
                sendCounter.isPending
              }
              onClick={() => counterOffer && sendCounter.mutate(counterOffer.id)}
            >
              {sendCounter.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Envoyer la contre-proposition'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lien éphémère accepté */}
      <Modal
        open={!!acceptedLink}
        onClose={() => setAcceptedLink(null)}
        title="Prix accordé ✅"
        description="Le lien éphémère a été envoyé au client (WhatsApp/SMS). Il reste valable 48 h et ne sert qu'une fois."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 break-all">
              {window.location.origin}
              {acceptedLink}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAcceptedLink(null)}>
              Fermer
            </Button>
            <Button className="flex-1 bg-brand hover:bg-brand-700 text-white" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier le lien'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
