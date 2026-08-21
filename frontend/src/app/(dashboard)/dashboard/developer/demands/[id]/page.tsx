'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Package,
  DollarSign,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Hammer,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useDemandMatches } from '@/hooks/useDemands';
import { getDeveloperDemandById } from '@/services/api/demands';
import { useAsync } from '@/hooks/useAsync';
import type { ModuleDemandStatus, MatchStatus } from '@afribiz/shared';

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

export default function DeveloperDemandDetailPage() {
  const params = useParams();
  const demandId = params?.id as string;

  const { data: demand, status: demandStatus } = useAsync(() => getDeveloperDemandById(demandId));
  const { data: matches, status: matchesStatus } = useDemandMatches(demandId);

  if (demandStatus === 'pending' || matchesStatus === 'pending')
    return <Loader variant="spinner" size="md" fullScreen />;

  const d = (demand as any) || null;
  if (!d) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12 text-gray-400" />}
        title="Demande introuvable"
        description="Cette demande n'existe pas ou n'est plus disponible."
        action={
          <Link href="/dashboard/developer/demands">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        }
      />
    );
  }

  const isInProgress = d.status === 'IN_PROGRESS';
  const acceptedMatch = Array.isArray(matches)
    ? matches.find((m: any) => m.status === 'ACCEPTED')
    : undefined;
  const matchesList = Array.isArray(matches) ? matches : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.title}
        badge={
          d.isUrgent
            ? {
                label: 'Urgent',
                className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
              }
            : undefined
        }
        breadcrumbs={[
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Demandes', href: '/dashboard/developer/demands' },
          { label: d.title },
        ]}
        actions={
          <Link href="/dashboard/developer/demands">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux demandes
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Badge variant="info" size="sm">
                {d.moduleType}
              </Badge>
              {d.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {Number(d.budget).toLocaleString()} {d.currency}
                </span>
              )}
              {d.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(d.deadline).toLocaleDateString()}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isInProgress ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {statusLabels[d.status as ModuleDemandStatus] || d.status}
              </span>
            </div>
          </div>
        </div>

        {d.business && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <MapPin className="w-3 h-3" />
            <span>{d.business.name}</span>
            {d.business.city && <span>- {d.business.city}</span>}
            {d.business.country && <span>- {d.business.country}</span>}
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-1">Description du besoin</h3>
          <p className="text-gray-600 whitespace-pre-wrap">
            {d.description || 'Aucune description fournie.'}
          </p>
        </div>

        {isInProgress && d.approvedDeveloper && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold text-base">Vous avez été approuvé !</span>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Le business vous a choisi pour réaliser ce module. Créez le module maintenant.
            </p>

            {acceptedMatch?.proposalType === 'CUSTOM_BUILD' ? (
              <Link href="/dashboard/developer/modules/publish">
                <Button>
                  <Hammer className="w-4 h-4 mr-2" />
                  Créer le module sur mesure
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={`/dashboard/developer/modules/${acceptedMatch?.moduleId}`}>
                  <Button variant="secondary">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir le module proposé
                  </Button>
                </Link>
                <Link href="/dashboard/developer/modules/publish">
                  <Button>
                    <Hammer className="w-4 h-4 mr-2" />
                    Créer une nouvelle version
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {!isInProgress && !acceptedMatch && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-500">
              En attente de la validation du business. Revenez vérifier le statut plus tard.
            </p>
          </div>
        )}
      </Card>

      {(matchesList?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Toutes les propositions ({matchesList?.length ?? 0})
          </h2>
          <div className="grid gap-3">
            {(matchesList ?? []).map((match: any) => (
              <Card key={match.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {match.developer?.companyName || 'Développeur'}
                    </p>
                    <span className="text-xs text-gray-400">
                      Score : {match.score} |{' '}
                      {match.proposalType === 'CUSTOM_BUILD' ? 'Sur mesure' : 'Module existant'}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    match.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : match.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {matchStatusLabels[match.status as MatchStatus] || match.status}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
