'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePlanningTask, useUpdatePlanningTask } from '@/features/hooks';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function EditPlanningTaskPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: task, isLoading, error, refetch } = usePlanningTask(id);
  const updateTask = useUpdatePlanningTask();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (task) {
      const t: any = task;
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      setForm({
        title: t.title || '',
        description: t.description || '',
        assignee: t.assignee || '',
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : '',
        priority: t.priority || 'MEDIUM',
        status: t.status || 'PENDING',
      });
    }
  }, [task]);

  if (!params?.id) return <ErrorState message="Tâche introuvable" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!task) return <p className="text-center py-12 text-gray-500">Tâche introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updateTask.mutateAsync({
        id,
        data: {
          ...form,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        },
      });
      router.push('/dashboard/planning');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier la tâche" description="Mettez à jour les informations de votre tâche"
        breadcrumbs={[{ label: 'Planification', href: '/dashboard/planning' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/planning/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <input type="text" value={form.title || ''} onChange={e => update('title', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={4} value={form.description || ''} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigné à</label>
            <input type="text" value={form.assignee || ''} onChange={e => update('assignee', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d'échéance</label>
            <input type="date" value={form.dueDate || ''} onChange={e => update('dueDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
              <select value={form.priority || 'MEDIUM'} onChange={e => update('priority', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                {PRIORITIES.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select value={form.status || 'PENDING'} onChange={e => update('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                {STATUSES.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href={`/dashboard/planning/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updateTask.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updateTask.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
