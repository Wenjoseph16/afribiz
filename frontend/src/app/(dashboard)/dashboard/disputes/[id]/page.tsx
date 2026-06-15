'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Scale, AlertTriangle, ArrowLeft, Edit, MessageCircle,
  Clock, Tag, FileText, DollarSign, User,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDispute, useUpdateDisputeStatus } from '@/features/hooks';

const typeLabels: Record<string, string> = {
  ORDER: 'Commande',
  BOOKING: 'Réservation',
  SERVICE: 'Service',
  PAYMENT: 'Paiement',
  OTHER: 'Autre',
};

const priorityConfig: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  LOW: { label: 'Faible', variant: 'default' },
  MEDIUM: { label: 'Moyenne', variant: 'info' },
  HIGH: { label: 'Haute', variant: 'warning' },
  CRITICAL: { label: 'Critique', variant: 'danger' },
};

const statusConfig: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' | 'default'; gradient: string }> = {
  OUVERT: { label: 'Ouvert', variant: 'danger', gradient: 'from-red-600 to-red-400' },
  EN_COURS: { label: 'En cours', variant: 'warning', gradient: 'from-amber-600 to-amber-400' },
  RESOLU: { label: 'Résolu', variant: 'success', gradient: 'from-emerald-600 to-emerald-400' },
  FERME: { label: 'Fermé', variant: 'default', gradient: 'from-gray-600 to-gray-400' },
};

const timelineStatuses = ['OUVERT', 'EN_COURS', 'RESOLU', 'FERME'];

export default function DisputeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: dispute, isLoading } = useDispute(id);

  const updateMutation = useUpdateDisputeStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Litige"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Litiges', href: '/dashboard/disputes' },
            { label: 'Détail' },
          ]}
        />
        <Card padding="lg">
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center mb-4">
              <Scale className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Litige introuvable</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Les détails des litiges seront disponibles prochainement
            </p>
            <Link href="/dashboard/disputes">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour aux litiges</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const sc = statusConfig[dispute.status] || statusConfig.OUVERT;
  const pc = priorityConfig[dispute.priority] || priorityConfig.MEDIUM;
  const currentStatusIndex = timelineStatuses.indexOf(dispute.status);
  const isReadOnly = dispute.status === 'RESOLU' || dispute.status === 'FERME';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={dispute.title || 'Litige'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Litiges', href: '/dashboard/disputes' },
          { label: dispute.title || 'Détail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <Link href={`/dashboard/disputes/${id}/edit`}>
                <Button variant="outline"><Edit className="h-4 w-4 mr-1.5" /> Modifier</Button>
              </Link>
            )}
            <Link href="/dashboard/disputes">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour</Button>
            </Link>
          </div>
        }
      />

      {/* Gradient header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${sc.gradient} p-6 sm:p-8`}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{dispute.title || 'Litige'}</h2>
            <Badge variant={sc.variant} className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {sc.label}
            </Badge>
          </div>
          {dispute.reference && (
            <p className="text-white/80 text-sm">Réf: {dispute.reference}</p>
          )}
          {dispute.createdAt && (
            <p className="text-white/70 text-xs mt-1">
              Créé le {new Date(dispute.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-12 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info card */}
          <Card padding="lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              Informations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Référence</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dispute.reference || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{typeLabels[dispute.type] || dispute.type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Priorité</p>
                <Badge variant={pc.variant} size="xs">{pc.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {dispute.amount != null ? `${Number(dispute.amount).toLocaleString('fr-FR')} FCFA` : '—'}
                </p>
              </div>
            </div>
            {dispute.relatedEntityId && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Entité liée</p>
                <p className="text-sm font-medium text-brand">{dispute.relatedEntityId}</p>
              </div>
            )}
          </Card>

          {/* Description */}
          {dispute.description && (
            <Card padding="lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand" />
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {dispute.description}
              </p>
            </Card>
          )}

          {/* Messages placeholder */}
          <Card padding="lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-brand" />
              Messages & Commentaires
            </h3>
            <div className="flex flex-col items-center py-8 text-center">
              <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Les détails des litiges seront disponibles prochainement</p>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status timeline */}
          <Card padding="lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              Chronologie
            </h3>
            <div className="space-y-0">
              {timelineStatuses.map((s, i) => {
                const cfg = statusConfig[s];
                const isPast = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                return (
                  <div key={s} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                    {i < timelineStatuses.length - 1 && (
                      <div className={`absolute left-[11px] top-6 w-0.5 h-full -z-10 ${
                        i < currentStatusIndex ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isPast ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {isPast ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-brand' : isPast ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {cfg.label}
                      </p>
                      {isCurrent && dispute.updatedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(dispute.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Actions */}
          {!isReadOnly && (
            <Card padding="lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
              <div className="space-y-2">
                {dispute.status === 'OUVERT' && (
                  <>
                    <Button
                      fullWidth
                      isLoading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id, status: 'EN_COURS' })}
                    >
                      Marquer en cours
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      isLoading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id, status: 'RESOLU' })}
                    >
                      Résoudre
                    </Button>
                  </>
                )}
                {dispute.status === 'EN_COURS' && (
                  <>
                    <Button
                      fullWidth
                      isLoading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id, status: 'RESOLU' })}
                    >
                      Résoudre
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      isLoading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id, status: 'FERME' })}
                    >
                      Fermer
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
