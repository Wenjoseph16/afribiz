'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreatePortfolioItem, usePortfolioCategories } from '@/features/hooks';

export default function NewPortfolioPage() {
  const router = useRouter();
  const createItem = useCreatePortfolioItem();
  const { data: categories } = usePortfolioCategories();
  const [form, setForm] = useState({
    title: '', description: '', category: '', image: '',
    clientName: '', projectDate: '', projectUrl: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        image: form.image || undefined,
        clientName: form.clientName || undefined,
        projectDate: form.projectDate || undefined,
        projectUrl: form.projectUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      router.push('/dashboard/portfolio');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const catList: string[] = Array.isArray(categories) ? categories : (categories?.map?.((c: any) => c.name || c) || []);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouvel élément" description="Ajoutez une réalisation à votre portfolio"
        breadcrumbs={[{ label: 'Portfolio', href: '/dashboard/portfolio' }, { label: 'Nouveau' }]}
        actions={<Link href="/dashboard/portfolio"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)} required placeholder="Ex: Site e-commerce pour AfriMarket"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Description détaillée du projet..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
              <select value={form.category} onChange={e => update('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                <option value="">Sélectionner une catégorie</option>
                {catList.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image (URL)</label>
              <input type="url" value={form.image} onChange={e => update('image', e.target.value)} placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du client</label>
              <input type="text" value={form.clientName} onChange={e => update('clientName', e.target.value)} placeholder="Ex: Jean Dupont"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date du projet</label>
              <input type="date" value={form.projectDate} onChange={e => update('projectDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL du projet</label>
            <input type="url" value={form.projectUrl} onChange={e => update('projectUrl', e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Ajouter un tag..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
              <Button type="button" variant="outline" size="sm" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/portfolio"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createItem.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createItem.isPending ? 'Création...' : 'Créer l\'élément'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
