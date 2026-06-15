'use client';

import { Shield, CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperProfile } from '@/features/developerHooks';
import type { DeveloperVerificationStatus } from '@/types/developer';

const STATUS_CONFIG: Record<DeveloperVerificationStatus, { label: string; icon: typeof Shield; variant: 'brand' | 'success' | 'warning' | 'danger'; description: string }> = {
  PENDING: { label: 'En attente', icon: Clock, variant: 'warning', description: 'Vos documents sont en cours de vérification par notre équipe.' },
  SUBMITTED: { label: 'Soumis', icon: Clock, variant: 'warning', description: 'Votre demande a été soumise. Nous vous répondrons sous 48h.' },
  VERIFIED: { label: 'Vérifié', icon: CheckCircle2, variant: 'success', description: 'Votre compte développeur est vérifié. Vous pouvez publier des modules.' },
  REJECTED: { label: 'Rejeté', icon: XCircle, variant: 'danger', description: 'Votre demande de vérification a été rejetée.' },
};

export default function ValidationPage() {
  const { data: profile, isLoading, error, refetch } = useDeveloperProfile();

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const status: DeveloperVerificationStatus = profile?.verificationStatus || 'PENDING';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Validation AfriBiz"
        description="Statut de vérification de votre compte développeur"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Validation' },
        ]}
      />

      <Card padding="lg">
        <div className="flex flex-col items-center text-center py-8">
          <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center mb-5',
            status === 'VERIFIED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' :
            status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-500' :
            status === 'SUBMITTED' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' :
            'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
          )}>
            <StatusIcon className="h-10 w-10" />
          </div>
          <Badge variant={config.variant} size="lg">{config.label}</Badge>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-md">{config.description}</p>

          {status === 'PENDING' && !profile?.onboardingCompleted && (
            <div className="mt-6">
              <Link href="/dashboard/developer/profile">
                <Button variant="gradient">
                  Compléter mon profil
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {status === 'PENDING' && profile?.onboardingCompleted && (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-left text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Aucune vérification soumise</p>
                  <p className="mt-1">Vous devez soumettre vos documents de vérification depuis la section vérification de votre profil.</p>
                </div>
              </div>
              <Link href="/dashboard/developer/profile">
                <Button size="sm" variant="secondary" className="mt-3">
                  Aller à la vérification
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {status === 'VERIFIED' && profile?.verifiedAt && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3">
              Vérifié le {new Date(profile.verifiedAt).toLocaleDateString('fr-FR')}
            </p>
          )}

          {status === 'REJECTED' && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 max-w-md w-full">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Raison du rejet</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {profile?.rejectionReason || 'Motif non spécifié. Veuillez contacter le support.'}
              </p>
              {profile?.rejectedAt && (
                <p className="text-xs text-red-400 mt-1">
                  Rejeté le {new Date(profile.rejectedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
              <Link href="/dashboard/developer/profile">
                <Button size="sm" variant="secondary" className="mt-3">
                  Modifier et soumettre à nouveau
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Shield className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Niveau</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Développeur</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600"><Shield className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Statut</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{config.label}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Modules publiés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile?.publishedModules || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
