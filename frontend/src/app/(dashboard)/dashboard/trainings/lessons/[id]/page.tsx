'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowLeft, Play, CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const lessonId = params.id as string;
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await apiClient.get(`/trainings/advanced/lessons/${lessonId}`);
      return res.data.data;
    },
    enabled: !!lessonId,
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/trainings/advanced/quiz/${lesson?.quiz?.id}/attempt`, { answers });
      return res.data.data;
    },
    onSuccess: (data) => {
      setQuizResult(data);
      setQuizSubmitted(true);
      qc.invalidateQueries({ queryKey: ['training-progress'] });
    },
  });

  if (isLoading) return <Loader />;
  if (!lesson) return <ErrorState message="Leçon non trouvée" />;

  const quiz = lesson.quiz;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/trainings/${lesson.training?.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader
          title={lesson.title}
          description={lesson.training?.title}
        />
      </div>

      {/* Content */}
      <Card>
        {lesson.videoUrl && (
          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
            <video controls className="w-full h-full rounded-lg" src={lesson.videoUrl} />
          </div>
        )}
        {lesson.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {lesson.content.split('\n').map((p: string, i: number) => (
              <p key={i} className="text-gray-700 dark:text-gray-300 mb-2">{p}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Contenu de la leçon à venir</p>
        )}
      </Card>

      {/* Quiz */}
      {quiz && !quizSubmitted && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-brand" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{quiz.title || 'Quiz'}</h3>
            {quiz.timeLimit && (
              <Badge variant="warning">{quiz.timeLimit} min</Badge>
            )}
            <Badge variant="default">Note requise: {quiz.passingScore}%</Badge>
          </div>
          {quiz.description && <p className="text-sm text-gray-500 mb-4">{quiz.description}</p>}

          <div className="space-y-6">
            {quiz.questions?.map((q: any, qi: number) => (
              <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {(q.options as string[]).map((opt: string, oi: number) => (
                    <button
                      key={oi}
                      onClick={() => {
                        const newAnswers = [...answers];
                        newAnswers[qi] = oi;
                        setAnswers(newAnswers);
                      }}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border text-sm transition-all',
                        answers[qi] === oi
                          ? 'border-brand bg-brand/5 text-brand font-medium'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => submitQuiz.mutate()}
            disabled={answers.length !== quiz.questions?.length || submitQuiz.isPending}
          >
            {submitQuiz.isPending ? 'Correction...' : 'Soumettre le quiz'}
          </Button>
        </Card>
      )}

      {/* Quiz Results */}
      {quizSubmitted && quizResult && (
        <Card>
          <div className="text-center py-6">
            {quizResult.passed ? (
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
            )}
            <h3 className={cn('text-xl font-bold mb-1', quizResult.passed ? 'text-emerald-600' : 'text-red-600')}>
              {quizResult.passed ? 'Quiz réussi ! 🎉' : 'Quiz échoué'}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {quizResult.score}% <span className="text-sm font-normal text-gray-400">({quizResult.totalQuestions} questions)</span>
            </p>
            {!quizResult.passed && (
              <Button variant="outline" className="mt-4" onClick={() => { setQuizSubmitted(false); setQuizResult(null); setAnswers([]); }}>
                <AlertTriangle className="h-4 w-4 mr-1.5" />Réessayer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Back button */}
      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />Retour à la formation
        </Button>
      </div>
    </div>
  );
}
