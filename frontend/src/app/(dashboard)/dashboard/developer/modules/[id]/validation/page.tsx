'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  FileCheck, Send, Clock, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, ListChecks, Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModule } from '@/features/developerHooks';
import {
  useModuleValidation, useValidationHistory,
  useSubmitForValidation,
} from '@/features/developerModulesHooks';
import type { ModuleValidation, ValidationCheck } from '@/types/developer';

const STATUS_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  PENDING: 'warning',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  CHANGES_REQUESTED: 'warning',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_REVIEW: 'En révision',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  CHANGES_REQUESTED: 'Modifications demandées',
};

const CHECK_STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  IN_PROGRESS: RefreshCw,
  COMPLETED: CheckCircle2,
};

const CHECK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-gray-400 bg-gray-100 dark:bg-gray-800',
  IN_PROGRESS: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  COMPLETED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
};

const CHECK_PASSED_COLORS: Record<string, string> = {
  true: 'text-emerald-500',
  false: 'text-red-500',
};

export default function ModuleValidationPage() {
  const params = useParams();
  const moduleId = params?.id as string;

  const { data: mod } = useDeveloperModule(moduleId);
  const { data: validation, isLoading, error, refetch } = useModuleValidation(moduleId);
  const { data: history } = useValidationHistory(moduleId);
  const submitForValidation = useSubmitForValidation();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    try {
      await submitForValidation.mutateAsync(moduleId);
      showToast('Module soumis pour validation', 'success');
    } catch {
      showToast("Erreur lors de la soumission", 'error');
    }
  };

  const historyList = useMemo(() => {
    if (!history) return [];
    return Array.isArray(history) ? history : [];
  }, [history]);

  const canSubmit = mod?.status === 'DRAFT' || mod?.status === 'REJECTED' || mod?.status === 'ARCHIVED';

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={cn(
          'p-3 rounded-xl text-sm font-medium',
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Validation du module</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soumettez votre module pour validation avant publication
          </p>
        </div>
        {canSubmit && (
          <Button variant="gradient" size="sm" onClick={handleSubmit} isLoading={submitForValidation.isPending}>
            <Send className="h-4 w-4" />
            Soumettre pour validation
          </Button>
        )}
      </div>

      {/* Current validation status */}
      {!validation ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucune validation en cours
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
              {mod?.status === 'PUBLISHED'
                ? 'Ce module est déjà publié.'
                : 'Soumettez votre module pour qu\'il soit vérifié par notre équipe avant publication.'}
            </p>
            {canSubmit && (
              <Button variant="gradient" onClick={handleSubmit} isLoading={submitForValidation.isPending}>
                <Send className="h-4 w-4" /> Soumettre pour validation
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Status banner */}
          <Card padding="lg" className={cn(
            'border-2',
            validation.status === 'APPROVED' ? 'border-emerald-300 dark:border-emerald-700' :
            validation.status === 'REJECTED' ? 'border-red-300 dark:border-red-700' :
            validation.status === 'CHANGES_REQUESTED' ? 'border-amber-300 dark:border-amber-700' :
            'border-blue-300 dark:border-blue-700'
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-2xl',
                validation.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                validation.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' :
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
              )}>
                {validation.status === 'APPROVED' ? <CheckCircle2 className="h-8 w-8" /> :
                 validation.status === 'REJECTED' ? <XCircle className="h-8 w-8" /> :
                 <Clock className="h-8 w-8" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {STATUS_LABELS[validation.status] || validation.status}
                  </h3>
                  <Badge variant={STATUS_VARIANT[validation.status] || 'default'}>{STATUS_LABELS[validation.status] || validation.status}</Badge>
                </div>
                {validation.score !== null && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Score : <span className="font-bold text-gray-900 dark:text-gray-100">{validation.score}/100</span>
                  </p>
                )}
                {validation.reviewerNotes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                    {validation.reviewerNotes}
                  </p>
                )}
                {validation.submittedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Soumis le {new Date(validation.submittedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Validation checks */}
          {validation.checks && validation.checks.length > 0 && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Tests de validation
              </h3>
              <div className="space-y-3">
                {validation.checks.map((check: ValidationCheck) => {
                  const CheckIcon = CHECK_STATUS_ICONS[check.status] || Clock;
                  return (
                    <div key={check.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className={cn('p-2 rounded-lg shrink-0', CHECK_STATUS_COLORS[check.status] || 'bg-gray-100')}>
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.type}</span>
                          {check.passed !== null && (
                            <span className={CHECK_PASSED_COLORS[String(check.passed)]}>
                              {check.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </span>
                          )}
                          {check.score !== null && (
                            <span className={cn(
                              'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                              check.score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                              check.score >= 50 ? 'bg-amber-50 text-amber-700' :
                              'bg-red-50 text-red-700'
                            )}>
                              {check.score}/100
                            </span>
                          )}
                        </div>
                        {check.details && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{check.details}</p>
                        )}
                        {check.completedAt && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Complété le {new Date(check.completedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        check.status === 'COMPLETED' ? (check.passed ? 'success' : 'danger') :
                        check.status === 'IN_PROGRESS' ? 'info' : 'warning'
                      } size="xs">
                        {check.status === 'COMPLETED' ? (check.passed ? 'Réussi' : 'Échoué') :
                         check.status === 'IN_PROGRESS' ? 'En cours' : 'En attente'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Validation history */}
      {historyList.length > 0 && (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Historique des validations</h3>
          <div className="space-y-3">
            {historyList.map((v: ModuleValidation) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    v.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                    v.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' :
                    'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                  )}>
                    {v.status === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> :
                     v.status === 'REJECTED' ? <XCircle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <Badge variant={STATUS_VARIANT[v.status] || 'default'} size="xs">
                      {STATUS_LABELS[v.status] || v.status}
                    </Badge>
                    {v.score !== null && (
                      <span className="text-xs text-gray-500 ml-2">Score: {v.score}/100</span>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(v.submittedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {v.reviewerNotes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs text-right truncate ml-4">
                    {v.reviewerNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
