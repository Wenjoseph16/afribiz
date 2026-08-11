'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  ArrowLeft,
  Star,
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
import { useMyDemands, useDemandMatches, useApproveDemand } from '@/hooks/useDemands';
import type { ModuleDemandStatus, MatchStatus, ProposalType } from '@afribiz/shared';

const statusLabels: Record<string, string> = {
  OPEN: 'Ouverte',
  MATCHED: 'Correspondance trouvée',
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

const proposalTypeLabels: Record<ProposalType, { label: string; color: string }> = {
  EXISTING: { label: 'Module existant', color: 'bg-blue-100 text-blue-700' },
  CUSTOM_BUILD: { label: 'Sur mesure', color: 'bg-purple-100 text-purple-700' },
};

export default function BusinessDemandDetailPage() {
  const params = useParams();
  const demandId = params?.id as string;
  const { data: demands, status: demandsStatus, execute: reloadDemands } = useMyDemands();
  const {
    data: matches,
    status: matchesStatus,
    execute: reloadMatches,
  } = useDemandMatches(demandId);
  const { approve, loading: approving } = useApproveDemand();

  if (demandsStatus === 'pending' || matchesStatus === 'pending')
    return <Loader variant="spinner" size="md" fullScreen />;

  const demandsList = Array.isArray(demands) ? demands : [];
  const demand = demandsList.find((d: any) => d.id === demandId);

  if (!demand) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12 text-gray-400" />}
        title="Demande introuvable"
        description="Cette demande n'existe pas ou ne vous appartient pas."
        action={
          <Link href="/dashboard/business/modules/demands">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />
    );
  }

  const matchesList = Array.isArray(matches) ? matches : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvedMatch: any = matchesList.find((m: any) => m.status === 'ACCEPTED');
  const isOpen = demand.status === 'OPEN';
  const isInProgress = demand.status === 'IN_PROGRESS';

  const handleApprove = async (matchId: string) => {
    try {
      await approve(demandId, matchId);
      await Promise.all([reloadDemands(), reloadMatches()]);
    } catch (e) {
      /* error shown by hook */
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={demand.title}
        badge={
          demand.isUrgent
            ? { label: 'Urgent', className: 'bg-red-500/10 text-red-600' }
            : undefined
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mes demandes', href: '/dashboard/business/modules/demands' },
          { label: demand.title },
        ]}
      />

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Badge variant="info" size="sm">
                {demand.moduleType}
              </Badge>
              {demand.budget && (
                <span>
                  {Number(demand.budget).toLocaleString()} {demand.currency}
                </span>
              )}
              {demand.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(demand.deadline).toLocaleDateString()}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOpen ? 'bg-green-100 text-green-800' : isInProgress ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}
              >
                {statusLabels[demand.status as ModuleDemandStatus] || demand.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-1">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap">
            {demand.description || 'Aucune description fournie.'}
          </p>
        </div>

        {isInProgress && (demand as any).approvedDeveloperId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <CheckCircle2 className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">Développeur approuvé :</span>
              <span>
                {approvedMatch?.developer?.companyName ||
                  [
                    approvedMatch?.developer?.user?.firstName,
                    approvedMatch?.developer?.user?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') || (demand as any).approvedDeveloperId}
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Le développeur est en train de travailler sur votre module.
            </p>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Propositions reçues ({matchesList.length})</h2>

        {matchesList.length === 0 ? (
          <Card className="p-8 text-center text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3" />
            <p>Aucune proposition pour le moment.</p>
            <p className="text-sm">
              Les développeurs verront votre demande et pourront proposer leurs modules.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matchesList.map((match: any) => {
              const pt = (match.proposalType || 'EXISTING') as ProposalType;
              const ptConfig = proposalTypeLabels[pt];
              return (
                <Card
                  key={match.id}
                  className={`p-5 ${match.status === 'ACCEPTED' ? 'ring-2 ring-green-400' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {match.developer?.companyName || 'Développeur'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {match.developer?.user?.firstName} {match.developer?.user?.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${ptConfig.color}`}
                        >
                          {pt === 'CUSTOM_BUILD' ? (
                            <Hammer className="w-3 h-3 inline mr-1" />
                          ) : (
                            <Package className="w-3 h-3 inline mr-1" />
                          )}
                          {ptConfig.label}
                        </span>

                        {match.module && (
                          <Link
                            href={`/marketplace/${match.module.slug}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Package className="w-3 h-3" />
                            {match.module.name}
                          </Link>
                        )}
                        {!match.module && pt === 'EXISTING' && (
                          <span className="text-gray-400 italic">Module non spécifié</span>
                        )}
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-3 h-3 fill-current" />
                          {match.score}
                        </span>
                      </div>

                      {match.matchReasons && match.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.matchReasons.map((reason: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}

                      {match.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          &ldquo;{match.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${matchStatusColors[match.status as MatchStatus] || ''}`}
                      >
                        {matchStatusLabels[match.status as MatchStatus] || match.status}
                      </span>
                      {isOpen && match.status === 'PENDING' && (
                        <Button
                          size="sm"
                          disabled={approving}
                          onClick={() => handleApprove(match.id)}
                        >
                          {approving ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          Approuver
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
