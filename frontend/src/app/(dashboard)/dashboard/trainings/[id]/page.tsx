'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen, Play, CheckCircle, ArrowLeft, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrainingDetailPage() {
  const params = useParams();
  const trainingId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['training-progress', trainingId],
    queryFn: async () => {
      const res = await apiClient.get('/trainings/advanced/' + trainingId + '/progress');
      return res.data.data;
    },
    enabled: !!trainingId,
  });

  if (isLoading) return <Loader />;
  if (!data) return <ErrorState message="Formation non trouvée" />;

  const training = data.training || {};
  const lessons = training.lessons || [];
  const progress = data.progress || 0;
  const status = data.status || 'NOT_STARTED';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/trainings" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={training.title || 'Formation'} description={training.description} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression</span>
            <Badge variant={status === 'COMPLETED' ? 'success' : status === 'IN_PROGRESS' ? 'warning' : 'default'}>
              {status === 'COMPLETED' ? 'Terminé' : status === 'IN_PROGRESS' ? 'En cours' : 'Non commencé'}
            </Badge>
          </div>
          <span className="text-sm font-bold text-brand">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all duration-700" style={{ width: progress + '%' }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{lessons.length} leçons</p>
      </Card>

      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leçons</h3>
      <div className="space-y-2">
        {lessons.map((lesson: any, index: number) => (
          <Link key={lesson.id} href={'/dashboard/trainings/lessons/' + lesson.id}>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all duration-200 group">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', lesson.isFree ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand')}>
                {lesson.quiz ? <FileText className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                  {index + 1}. {lesson.title}
                </p>
                {lesson.description && <p className="text-xs text-gray-500 truncate mt-0.5">{lesson.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lesson.duration > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{lesson.duration}min
                  </span>
                )}
                {lesson.isFree && <Badge variant="success">Gratuit</Badge>}
                {lesson.quiz && <Badge variant="info">Quiz</Badge>}
              </div>
            </div>
          </Link>
        ))}
        {lessons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Aucune leçon pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
