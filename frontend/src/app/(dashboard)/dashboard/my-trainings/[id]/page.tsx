'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
  Download,
  BookOpen,
  Award,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { TransactionProgress } from '@/components/transactions';
import { downloadICS } from '@/lib/calendarSync';

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
  IN_PROGRESS: {
    label: 'En cours',
    color: 'bg-purple-100 text-purple-700',
    banner:
      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
    icon: GraduationCap,
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'Inscription en attente',
    description: 'Votre inscription est en cours de traitement',
  },
  REGISTERED: { title: 'Inscrit à la formation', description: 'Commencez quand vous êtes prêt !' },
  IN_PROGRESS: { title: 'Formation en cours', description: 'Continuez votre apprentissage' },
  COMPLETED: {
    title: 'Formation terminée !',
    description: 'Félicitations, vous avez terminé cette formation',
  },
  CANCELLED: { title: 'Inscription annulée', description: 'Votre inscription a été annulée' },
};

const CANCELLABLE_STATUSES = ['PENDING', 'REGISTERED'];

export default function TrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: transaction } = useTransactionDetail('TRAINING', id);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/trainings/my/${id}`);
      setEnrollment(res.data.data);
    } catch (e: any) {
      setError(e.message || 'Formation non trouvée');
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
  useTransactionSocket('TRAINING', id, handleSocketUpdate);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (error || !enrollment)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{error || 'Formation non trouvée'}</p>
      </div>
    );

  const e: any = enrollment;
  const training = e.training || e;
  const status = STATUS_CONFIG[e.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const statusMsg = STATUS_MESSAGES[e.status] || STATUS_MESSAGES.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(e.status);
  const hasCertificate = !!e.certificateUrl;
  const progress = e.progress || 0;
  const lessons = training.TrainingLesson || training.lessons || [];
  const businessName = training.business?.name || '—';

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
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {training.title || `Formation #${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {training.category && <>{training.category} · </>}
                    {businessName !== '—' && <>{businessName}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {transaction && (
            <TransactionProgress
              type="TRAINING"
              progress={transaction.progress || progress}
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

      {/* Certificate */}
      {hasCertificate && (
        <Card className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <Award className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Certificat de réussite
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Félicitations ! Vous avez terminé cette formation.
          </p>
          <Button variant="primary" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Télécharger le certificat
          </Button>
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
                title: training.title || 'Formation',
                description: training.description || undefined,
                location: training.location || undefined,
                startDate: new Date(training.startDate || training.start_date || Date.now()),
                endDate: training.endDate ? new Date(training.endDate) : undefined,
                businessName: businessName !== '—' ? businessName : undefined,
              },
              `training_${id}.ics`
            )
          }
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Calendrier
        </Button>
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter le formateur
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
                  <BookOpen className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Leçons</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {lessons.length}
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
                  <p className="text-xs text-gray-500">Progression</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{progress}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Terminées</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {e.completedLessons || 0}/{lessons.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Certificat</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {hasCertificate ? 'Obtenu' : 'Non'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Lessons list */}
          {lessons.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Programme ({lessons.length} leçons)
              </h3>
              <div className="space-y-2">
                {lessons.map((lesson: any, i: number) => {
                  const isCompleted =
                    lesson.completed || (e.completedLessonIds || []).includes(lesson.id);
                  return (
                    <div
                      key={lesson.id || i}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-colors',
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-900/10'
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-medium">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isCompleted
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {lesson.title}
                        </p>
                        {lesson.duration && (
                          <p className="text-xs text-gray-500">{lesson.duration} min</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Formateur</h3>
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-white">{businessName}</span>
            </div>
          </Card>

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
                <span className="text-gray-500">Inscrit le</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {e.createdAt ? new Date(e.createdAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              {training.price && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Prix</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Number(training.price).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
