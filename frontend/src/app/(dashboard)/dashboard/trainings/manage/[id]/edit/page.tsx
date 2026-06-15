'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useBizTraining, useUpdateBizTraining } from '@/features/hooks';

const CATEGORIES = ['BUSINESS', 'TECHNOLOGY', 'MARKETING', 'FINANCE', 'MANAGEMENT', 'LANGUES', 'ART', 'AUTRE'];

export default function EditTrainingPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const { data: training, isLoading, error, refetch } = useBizTraining(id);
  const update = useUpdateBizTraining();

  const [form, setForm] = useState({ title: '', description: '', category: '', duration: '' });

  useEffect(() => {
    if (training) {
      const t: any = training;
      setForm({
        title: t.title || '',
        description: t.description || '',
        category: t.category || '',
        duration: t.duration || '',
      });
    }
  }, [training]);

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!training) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Formation introuvable</p></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ id, data: form });
      router.push(`/dashboard/trainings/manage/${id}`);
    } catch {}
  };

  const updateField = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier la formation" description="Modifiez les informations de votre formation"
        breadcrumbs={[
          { label: 'Formations', href: '/dashboard/trainings/manage' },
          { label: (training as any)?.title || 'Modifier' },
        ]}
        actions={<Link href={`/dashboard/trainings/manage/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Titre *</label>
            <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} required placeholder="Titre de la formation" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={4} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Description de la formation..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={e => updateField('category', e.target.value)} className={inputCls}>
                <option value="">Sélectionnez</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Durée estimée</label>
              <input type="text" value={form.duration} onChange={e => updateField('duration', e.target.value)} placeholder="3 heures, 2 semaines..." className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link href={`/dashboard/trainings/manage/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" isLoading={update.isPending} disabled={!form.title.trim() || update.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{update.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
