'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, BookOpen, Plus, Trash2, Loader,
  Users, GraduationCap, Clock, FileText, Video,
  HelpCircle, Save, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  useBizTraining, useBizTrainingStudents,
  useCreateBizLesson, useUpdateBizLesson, useDeleteBizLesson,
  useCreateBizQuiz, useDeleteBizQuiz,
} from '@/features/hooks';

type TabId = 'lecons' | 'quiz' | 'eleves';

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function TrainingDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const { data: training, isLoading, error, refetch } = useBizTraining(id);
  const { data: studentsData } = useBizTrainingStudents(id);
  const createLesson = useCreateBizLesson();
  const updateLesson = useUpdateBizLesson();
  const deleteLesson = useDeleteBizLesson();
  const createQuiz = useCreateBizQuiz();
  const deleteQuiz = useDeleteBizQuiz();

  const [activeTab, setActiveTab] = useState<TabId>('lecons');
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content: '', videoUrl: '', duration: '', isFree: false });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState({ passingScore: '70', maxAttempts: '3', timeLimit: '', questions: '' });

  const resetLessonForm = () => {
    setLessonForm({ title: '', description: '', content: '', videoUrl: '', duration: '', isFree: false });
    setEditingLessonId(null);
    setShowLessonForm(false);
  };

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!training) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Formation introuvable</p></div>;

  const t: any = training;
  const lessons: any[] = t.TrainingLesson || [];
  const students: any[] = studentsData?.items || t.users || [];
  const lessonCount = t._count?.TrainingLesson || lessons.length;
  const studentCount = t._count?.users || students.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/trainings/manage" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <Link href={`/dashboard/trainings/manage/${id}/edit`}>
          <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
        </Link>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-blue-800 rounded-2xl p-8 text-white">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-white/70 text-sm">{t.description || 'Aucune description'}</p>
          <div className="flex flex-wrap gap-3 text-sm text-white/80 mt-3">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{lessonCount} lecon{lessonCount > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{studentCount} eleve{studentCount > 1 ? 's' : ''}</span>
            {t.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{t.duration}</span>}
            {t.category && <Badge variant="brand" size="xs">{t.category}</Badge>}
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'lecons', label: 'Lecons', icon: <BookOpen className="h-4 w-4" /> },
          { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="h-4 w-4" /> },
          { id: 'eleves', label: 'Eleves', icon: <Users className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="pills"
      />

      {/* Lecons Tab */}
      {activeTab === 'lecons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lecons</h3>
            <Button size="sm" onClick={() => { resetLessonForm(); setShowLessonForm(true); }}>
              <Plus className="h-4 w-4 mr-1.5" />Ajouter une lecon
            </Button>
          </div>

          {showLessonForm && (
            <LessonFormCard
              lessonForm={lessonForm}
              setLessonForm={setLessonForm}
              editingLessonId={editingLessonId}
              onSave={async () => {
                const data: any = {
                  trainingId: id,
                  title: lessonForm.title,
                  description: lessonForm.description,
                  content: lessonForm.content,
                  videoUrl: lessonForm.videoUrl || undefined,
                  duration: lessonForm.duration ? parseInt(lessonForm.duration) : 0,
                  sortOrder: lessons.length,
                  isFree: lessonForm.isFree,
                };
                if (editingLessonId) {
                  await updateLesson.mutateAsync({ id: editingLessonId, data });
                } else {
                  await createLesson.mutateAsync(data);
                }
                resetLessonForm();
                refetch();
              }}
              isPending={createLesson.isPending || updateLesson.isPending}
              onCancel={resetLessonForm}
            />
          )}

          {lessons.length === 0 && !showLessonForm ? (
            <Card className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune lecon</h3>
              <p className="text-sm text-gray-500 mb-4">Ajoutez votre premiere lecon</p>
              <Button onClick={() => setShowLessonForm(true)}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson: any, idx: number) => (
                <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-brand/30 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                        {lesson.videoUrl ? <Video className="h-5 w-5 text-brand" /> : <FileText className="h-5 w-5 text-brand" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{idx + 1}. {lesson.title}</h4>
                        {lesson.description && <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          {lesson.duration > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{lesson.duration}min</span>}
                          {lesson.isFree && <Badge variant="success" size="xs">Gratuit</Badge>}
                          {lesson.TrainingQuiz?.length > 0 && <Badge variant="info" size="xs">{lesson.TrainingQuiz.length} quiz</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => {
                        setEditingLessonId(lesson.id);
                        setLessonForm({
                          title: lesson.title || '', description: lesson.description || '',
                          content: lesson.content || '', videoUrl: lesson.videoUrl || '',
                          duration: lesson.duration?.toString() || '', isFree: lesson.isFree || false,
                        });
                        setShowLessonForm(true);
                      }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => {
                        setQuizLessonId(lesson.id);
                        setQuizForm({ passingScore: '70', maxAttempts: '3', timeLimit: '', questions: '' });
                        setShowQuizForm(true);
                      }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand" title="Ajouter un quiz">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm('Supprimer cette lecon ?')) deleteLesson.mutate(lesson.id); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quiz des lecons</h3>

          {showQuizForm && quizLessonId && (
            <Card padding="lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Nouveau quiz pour : {lessons.find((l: any) => l.id === quizLessonId)?.title || ''}
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Note de passage (%)</label>
                    <input type="number" min={0} max={100} value={quizForm.passingScore} onChange={e => setQuizForm({ ...quizForm, passingScore: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tentatives max</label>
                    <input type="number" min={1} value={quizForm.maxAttempts} onChange={e => setQuizForm({ ...quizForm, maxAttempts: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Limite de temps (min)</label>
                    <input type="number" min={0} value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Questions</label>
                  <p className="text-xs text-gray-400 mb-2">Format: Question | Option1,Option2,... | IndexCorrect | Explication</p>
                  <textarea rows={8} value={quizForm.questions} onChange={e => setQuizForm({ ...quizForm, questions: e.target.value })}
                    className={inputCls} placeholder="Question 1 | Opt1,Opt2,Opt3 | 0 | Explication" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={async () => {
                  const questions = quizForm.questions
                    ? quizForm.questions.split('\n').filter(Boolean).map((line, i) => {
                        const parts = line.split('|');
                        return {
                          question: parts[0]?.trim() || 'Question ' + (i + 1),
                          options: (parts[1] || '').split(',').map((o: string) => o.trim()),
                          correctIndex: parseInt(parts[2]) || 0,
                          explanation: parts[3]?.trim() || '',
                        };
                      })
                    : [];
                  await createQuiz.mutateAsync({
                    lessonId: quizLessonId,
                    title: 'Quiz',
                    passingScore: parseInt(quizForm.passingScore),
                    maxAttempts: parseInt(quizForm.maxAttempts),
                    timeLimit: quizForm.timeLimit ? parseInt(quizForm.timeLimit) : undefined,
                    questions,
                  });
                  setShowQuizForm(false);
                  setQuizLessonId(null);
                  setQuizForm({ passingScore: '70', maxAttempts: '3', timeLimit: '', questions: '' });
                  refetch();
                }} isLoading={createQuiz.isPending}><Save className="h-4 w-4 mr-1.5" />Creer le quiz</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowQuizForm(false); setQuizLessonId(null); }}>Annuler</Button>
              </div>
            </Card>
          )}

          {lessons.filter((l: any) => l.TrainingQuiz?.length > 0).length === 0 && !showQuizForm ? (
            <Card className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun quiz</h3>
              <p className="text-sm text-gray-500">Ajoutez des quiz a vos lecons depuis l&apos;onglet Lecons</p>
            </Card>
          ) : !showQuizForm && (
            <div className="space-y-3">
              {lessons.filter((l: any) => l.TrainingQuiz?.length > 0).map((lesson: any) =>
                lesson.TrainingQuiz.map((quiz: any) => (
                  <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <HelpCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{quiz.title}</h4>
                          <p className="text-xs text-gray-500">Lecon: {lesson.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>{quiz.QuizQuestion?.length || 0} questions</span>
                            <span>Note requise: {quiz.passingScore}%</span>
                            <span>Max {quiz.maxAttempts} tentatives</span>
                            {quiz.timeLimit && <span>Limite: {quiz.timeLimit}min</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => { if (confirm('Supprimer ce quiz ?')) deleteQuiz.mutate(quiz.id); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Eleves Tab */}
      {activeTab === 'eleves' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Eleves inscrits <span className="text-sm font-normal text-gray-400">({studentCount})</span>
          </h3>

          {students.length === 0 ? (
            <Card className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun inscrit</h3>
              <p className="text-sm text-gray-500">Les eleves inscrits a cette formation apparaîtront ici</p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Eleve</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Progression</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Inscrit le</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Certificat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((stu: any) => (
                    <tr key={stu.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xs font-medium text-brand shrink-0">
                            {stu.user?.firstName?.[0] || stu.user?.email?.[0] || '?'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{stu.user?.firstName} {stu.user?.lastName}</span>
                            <span className="text-xs text-gray-400 block">{stu.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', stu.progress >= 100 ? 'bg-green-500' : 'bg-brand')} style={{ width: `${stu.progress || 0}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{stu.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={stu.status === 'COMPLETED' ? 'success' : stu.status === 'IN_PROGRESS' ? 'brand' : 'default'} size="xs">
                          {stu.status === 'COMPLETED' ? 'Termine' : stu.status === 'IN_PROGRESS' ? 'En cours' : stu.status === 'NOT_STARTED' ? 'Pas commence' : stu.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {stu.createdAt ? new Date(stu.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {stu.certificateUrl ? (
                          <a href={stu.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline text-xs">Voir</a>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Lesson Form Sub-component =====

function LessonFormCard({
  lessonForm, setLessonForm, editingLessonId, onSave, isPending, onCancel,
}: {
  lessonForm: any;
  setLessonForm: (f: any) => void;
  editingLessonId: string | null;
  onSave: () => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <Card padding="lg" className="border-brand/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {editingLessonId ? 'Modifier la lecon' : 'Nouvelle lecon'}
        </h4>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Titre</label>
          <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className={inputCls} placeholder="Titre de la lecon" required />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>
          <textarea rows={2} value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} className={inputCls} placeholder="Description optionnelle" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Contenu (Markdown)</label>
          <textarea rows={6} value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} className={inputCls} placeholder="Contenu de la lecon (Markdown supporte)" />
        </div>
        <div>
          <label className={labelCls}>Video URL (optionnel)</label>
          <input type="text" value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className={labelCls}>Duree (minutes)</label>
          <input type="number" min={0} value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} className={inputCls} placeholder="30" />
        </div>
      </div>
      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <input type="checkbox" checked={lessonForm.isFree} onChange={e => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
          className="rounded border-gray-300 text-brand focus:ring-brand/20" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Lecon gratuite (accessible sans inscription)</span>
      </label>
      <div className="flex items-center gap-3 mt-4">
        <Button size="sm" onClick={onSave} isLoading={isPending}>
          <Save className="h-4 w-4 mr-1.5" />{editingLessonId ? 'Mettre a jour' : 'Creer la lecon'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </Card>
  );
}
