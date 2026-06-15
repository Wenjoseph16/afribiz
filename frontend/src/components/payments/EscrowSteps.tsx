'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import {
  Shield, CheckCircle, Lock, Unlock, Clock,
  Layers, DollarSign, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscrowStepsProps {
  escrowId: string;
}

export function EscrowSteps({ escrowId }: EscrowStepsProps) {
  const qc = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['escrow-steps', escrowId],
    queryFn: async () => {
      const res = await apiClient.get(`/escrow/${escrowId}/steps`);
      return res.data.data;
    },
    enabled: !!escrowId,
  });

  const releaseStepMutation = useMutation({
    mutationFn: (stepNumber: number) => apiClient.post(`/escrow/${escrowId}/release-step/${stepNumber}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escrow-steps', escrowId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Erreur lors de la libération');
    },
  });

  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Loader className="py-8" />;
  if (!progress) {
    return (
      <Card padding="md">
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
          <Shield className="h-8 w-8" />
          <p className="text-sm">Aucun escrow trouvé</p>
        </div>
      </Card>
    );
  }

  const isStandard = progress.type === 'STANDARD';
  const isActive = progress.status === 'HELD';
  const isReleased = progress.status === 'RELEASED';
  const isDisputed = progress.status === 'DISPUTED';

  const statusLabels: Record<string, string> = {
    HELD: 'Actif (séquestre)',
    RELEASED: 'Libéré',
    DISPUTED: 'Litige',
    REFUNDED: 'Remboursé',
  };

  if (isStandard) {
    return (
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Escrow standard</h3>
          </div>
          <Badge variant={isDisputed ? 'danger' : isReleased ? 'success' : isActive ? 'warning' : 'info'}>
            {statusLabels[progress.status] || progress.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Number(progress.amount).toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Montant séquestré</p>
          </div>
          {isActive && (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400">Fonds bloqués</span>
            </div>
          )}
          {isReleased && (
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Fonds libérés</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Stepped escrow
  const { steps = [], totalSteps = 0, currentStep = 0, progress: progressPercent = 0, totalReleased = 0, totalAmount = 0 } = progress;

  return (
    <Card padding="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Escrow par étapes</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{currentStep}/{totalSteps} étapes</span>
          <Badge variant={isDisputed ? 'danger' : isReleased ? 'success' : isActive ? 'warning' : 'info'}>
            {statusLabels[progress.status] || progress.status}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progression</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Amount summary */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Libéré</p>
          <p className="text-sm font-bold text-emerald-600">{Number(totalReleased).toLocaleString()} FCFA</p>
        </div>
        <DollarSign className="h-4 w-4 text-gray-300" />
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{Number(totalAmount).toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Steps timeline */}
      <div className="relative">
        {steps.map((step: any, index: number) => {
          const isReleased = step.status === 'RELEASED';
          const isCurrent = step.status === 'PENDING' && (index === 0 || steps[index - 1]?.status === 'RELEASED');
          const isLocked = !isReleased && !isCurrent;
          const canRelease = isCurrent && isActive;

          return (
            <div key={step.step} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Timeline line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'absolute left-[15px] top-8 w-0.5 h-[calc(100%-32px)]',
                  isReleased ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                )} />
              )}

              {/* Step circle */}
              <div className={cn(
                'relative z-10 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                isReleased
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600'
                  : isCurrent
                    ? 'bg-brand/10 dark:bg-brand/20 border-brand text-brand animate-pulse'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              )}>
                {isReleased ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Étape {step.step}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {Number(step.amount).toLocaleString()} FCFA
                    </p>
                    {isReleased && (
                      <Badge variant="success" size="xs" className="mt-0.5">
                        Libéré
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="warning" size="xs" className="mt-0.5">
                        En attente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Release button */}
                {canRelease && (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => {
                      setError(null);
                      releaseStepMutation.mutate(step.step);
                    }}
                    isLoading={releaseStepMutation.isPending}
                    className="mt-2"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Libérer l'étape {step.step}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
