'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Package,
  Hammer,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getMyMatchedDemands } from '@/services/api/demands';
import { useAsync } from '@/hooks/useAsync';
import type { MatchStatus, ProposalType } from '@afribiz/shared';

const statusLabels: Record<string, string> = {
  OPEN: 'Ouverte',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const matchStatusLabels: Record<MatchStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Accepté',
  REJECTED: 'Rejeté',
  COMPLETED: 'Terminé',
};

const matchStatusColors: Record<MatchStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function MyProposalsPage() {
  const { data: matches, status, execute: reload } = useAsync(() => getMyMatchedDemands());

  if (status === 'pending') return <Loader variant="spinner" size="md" fullScreen />;

  const list = Array.isArray(matches) ? matches : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes propositions"
        description="Suivez le statut de vos propositions aux demandes de modules"
        breadcrumbs={[
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Demandes', href: '/dashboard/developer/demands' },
          { label: 'Mes propositions' },
        ]}
        actions={
          <Link href="/dashboard/developer/demands">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voir les demandes ouvertes
            </Button>
          </Link>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-400" />}
          title="Aucune proposition"
          description="Vous n'avez encore proposé aucun module."
          action={
            <Link href="/dashboard/developer/demands">
              <Button>Voir les demandes ouvertes</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {list.map((match: any) => {
            const demand = match.demand;
            return (
              <Link key={match.id} href={`/dashboard/developer/demands/${demand?.id || ''}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{demand?.title || 'Demande'}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${matchStatusColors[match.status as MatchStatus] || ''}`}
                        >
                          {matchStatusLabels[match.status as MatchStatus] || match.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {demand?.moduleType && (
                          <Badge variant="info" size="sm">
                            {demand.moduleType}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          {match.proposalType === 'CUSTOM_BUILD' ? (
                            <>
                              <Hammer className="w-3 h-3" /> Sur mesure
                            </>
                          ) : (
                            <>
                              <Package className="w-3 h-3" /> Module existant
                            </>
                          )}
                        </span>
                        {match.score && <span>Score: {match.score}</span>}
                      </div>

                      {demand?.business && (
                        <p className="text-sm text-gray-400">
                          {demand.business.name}
                          {demand.business.city ? ` - ${demand.business.city}` : ''}
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        demand?.status === 'OPEN'
                          ? 'bg-green-100 text-green-800'
                          : demand?.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabels[demand?.status as string] || demand?.status}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
