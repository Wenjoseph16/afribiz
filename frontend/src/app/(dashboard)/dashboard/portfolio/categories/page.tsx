'use client';

import { useState, useMemo } from 'react';
import { Folder, Plus, Pencil, Trash2, Loader, Image, Palette } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePortfolioCategories } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

export default function PortfolioCategoriesPage() {
  const { data: categoriesData, isLoading, refetch } = usePortfolioCategories();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: 'Folder', color: '#10b981' });
  const [deleting, setDeleting] = useState<string | null>(null);

  const categories: any[] = useMemo(() => {
    const raw = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || categoriesData?.data || []);
    return raw;
  }, [categoriesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updatePortfolioCategory(editingId, form);
      } else {
        await apiClient.createPortfolioCategory(form);
      }
      setShowCreate(false); setEditingId(null);
      setForm({ name: '', icon: 'Folder', color: '#10b981' });
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await apiClient.deletePortfolioCategory(id); refetch(); } catch (err) { console.error(err); }
    setDeleting(null);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ name: cat.name || '', icon: cat.icon || 'Folder', color: cat.color || '#10b981' });
    setShowCreate(true);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories portfolio</h1><p className="text-sm text-gray-500">Organisez vos projets par catégorie</p></div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm({ name: '', icon: 'Folder', color: '#10b981' }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />Nouvelle catégorie
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-brand" /><div><p className="text-[10px] text-gray-500">Catégories</p><p className="text-lg font-bold">{categories.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-500" /><div><p className="text-[10px] text-gray-500">Projets liés</p><p className="text-lg font-bold">—</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Palette className="w-4 h-4 text-purple-500" /><div><p className="text-[10px] text-gray-500">Couleurs</p><p className="text-lg font-bold">{new Set(categories.map((c: any) => c.color)).size}</p></div></div></Card>
      </div>

      {categories.length === 0 ? (
        <Card className="text-center py-12"><Folder className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune catégorie</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <Card key={cat.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                    <Folder className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat._count?.items || cat.itemCount || 0} projet(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} disabled={deleting === cat.id} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{editingId ? 'Modifier' : 'Nouvelle'} catégorie</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Couleur</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full h-10 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent cursor-pointer" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" disabled={!form.name} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
