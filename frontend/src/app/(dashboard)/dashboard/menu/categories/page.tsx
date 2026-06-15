'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight, Search, GripVertical, Loader, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useMenuCategories, useCreateMenuCategory, useUpdateMenuCategory, useDeleteMenuCategory } from '@/features/hooks';

function CatRow({ cat, depth = 0, onEdit, onDelete }: { cat: any; depth?: number; onEdit: (c: any) => void; onDelete: (c: any) => void }) {
  const [showChildren, setShowChildren] = useState(true);
  return (
    <>
      <div className={cn('flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', depth > 0 && 'ml-8')}>
        <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
        {cat.children?.length > 0 && (
          <button onClick={() => setShowChildren(!showChildren)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <ChevronRight className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', showChildren && 'rotate-90')} />
          </button>
        )}
        {!cat.children?.length && <div className="w-4" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
          {cat.description && <p className="text-xs text-gray-400">{cat.description}</p>}
        </div>
        {cat.icon && <span className="text-lg">{cat.icon}</span>}
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{cat._count?.items || cat.itemsCount || 0} plats</span>
        <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => onDelete(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {showChildren && cat.children?.map((child: any) => <CatRow key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />)}
    </>
  );
}

export default function MenuCategoriesPage() {
  const { data: catsData, isLoading } = useMenuCategories();
  const createCategory = useCreateMenuCategory();
  const updateCategory = useUpdateMenuCategory();
  const deleteCategory = useDeleteMenuCategory();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '', parentId: '' });
  const [saving, setSaving] = useState(false);

  const categories = Array.isArray(catsData) ? catsData : (catsData?.categories || catsData?.data || []);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', description: '', icon: '', parentId: '' });
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '', parentId: cat.parentId || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editCat) {
        await updateCategory.mutateAsync({ id: editCat.id, data: { name: form.name, description: form.description || undefined, icon: form.icon || undefined, parentId: form.parentId || null } });
      } else {
        await createCategory.mutateAsync({ name: form.name, description: form.description || undefined, icon: form.icon || undefined, parentId: form.parentId || undefined });
      }
      setModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await deleteCategory.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories</h1><p className="text-sm text-gray-500">Organisez vos plats</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Nouvelle catégorie</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center"><p className="text-2xl font-bold text-gray-900">{categories.length}</p><p className="text-xs text-gray-500">Catégories</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-bold text-gray-900">{categories.reduce((a: number, c: any) => a + (c._count?.items || c.itemsCount || 0) + (c.children?.reduce((s: number, ch: any) => s + (ch._count?.items || ch.itemsCount || 0), 0) || 0), 0)}</p><p className="text-xs text-gray-500">Plats</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-bold text-gray-900">{categories.reduce((a: number, c: any) => a + (c.children?.length || 0), 0)}</p><p className="text-xs text-gray-500">Sous-catégories</p></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10" />
      </div>

      <Card>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          <div className="px-4 py-2 flex items-center gap-3 text-xs font-medium text-gray-400 uppercase">
            <div className="w-4" /><div className="w-4" /><span className="flex-1">Catégorie</span><span>Plats</span><span className="w-16" />
          </div>
          {categories.map((cat: any) => <CatRow key={cat.id} cat={cat} onEdit={openEdit} onDelete={(c) => setDeleteConfirm(c)} />)}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <div className="space-y-4">
          <Input label="Nom *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Plats locaux, Grillades..." />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100" rows={2} />
          </div>
          <Input label="Icône (emoji)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="Ex: 🍗, 🥘, 🥤" />
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie parente</label>
            <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
              <option value="">Aucune (catégorie racine)</option>
              {categories.filter((c: any) => !editCat || c.id !== editCat.id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving}><Save className="w-4 h-4 mr-1.5" />{editCat ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer la catégorie" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm?.name}</strong> ? Les plats de cette catégorie ne seront pas supprimés mais deviendront non catégorisés.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
