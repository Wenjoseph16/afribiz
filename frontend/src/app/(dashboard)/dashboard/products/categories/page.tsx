'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Pencil, Trash2, FolderTree,
  ChevronRight, ChevronDown,
  Search, X, Save, Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useProductCategories, useCreateProductCategory, useUpdateProductCategory, useDeleteProductCategory } from '@/features/hooks';

interface Category {
  id: string; name: string; slug: string; description?: string;
  icon?: string; image?: string; parentId: string | null;
  sortOrder: number; isActive: boolean; productCount: number; children?: Category[];
}

export default function CategoriesPage() {
  const { data: catsData, isLoading, error, refetch } = useProductCategories();
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const createCategory = useCreateProductCategory();
  const updateCategory = useUpdateProductCategory();
  const deleteCategory = useDeleteProductCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');

  // Load categories from API
  const loadedCats: Category[] = useMemo(() => {
    return Array.isArray(catsData) ? catsData : (catsData?.categories || catsData?.data || []);
  }, [catsData]);

  useEffect(() => {
    if (loadedCats.length > 0) setCategories(loadedCats);
  }, [loadedCats]);

  const stats = useMemo(() => ({
    total: categories.reduce((acc, c) => acc + 1 + (c.children?.length || 0), 0),
    parents: categories.length,
    totalProducts: categories.reduce((acc, c) => acc + c.productCount + (c.children?.reduce((s, ch) => s + ch.productCount, 0) || 0), 0),
  }), [categories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) ||
      c.children?.some(ch => ch.name.toLowerCase().includes(q))
    ).map(c => ({ ...c, children: c.children?.filter(ch => ch.name.toLowerCase().includes(q)) }));
  }, [categories, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const openCreateModal = (parentId: string | null = null) => {
    setEditingCategory(null); setSelectedParentId(parentId);
    setFormName(''); setFormDescription(''); setFormIcon('');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat); setSelectedParentId(cat.parentId);
    setFormName(cat.name); setFormDescription(cat.description || ''); setFormIcon(cat.icon || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const payload = { name: formName.trim(), description: formDescription || undefined, icon: formIcon || undefined, parentId: selectedParentId };
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data: payload });
    } else {
      await createCategory.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (cat: Category) => {
    if (cat.productCount > 0 || (cat.children?.length || 0) > 0) return;
    if (!confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    await deleteCategory.mutateAsync(cat.id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Catégories</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organisez vos produits par catégories</p></div>
        </div>
        <Button onClick={() => openCreateModal(null)}><Plus className="h-4 w-4 mr-1.5" />Nouvelle catégorie</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p><p className="text-xs text-gray-500 mt-0.5">Catégories</p></Card>
        <Card padding="sm" className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.parents}</p><p className="text-xs text-gray-500 mt-0.5">Principales</p></Card>
        <Card padding="sm" className="text-center"><p className="text-2xl font-bold text-brand">{stats.totalProducts}</p><p className="text-xs text-gray-500 mt-0.5">Produits</p></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-800 dark:text-gray-100" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune catégorie</h3>
            <Button onClick={() => openCreateModal(null)}><Plus className="h-4 w-4 mr-1.5" />Créer</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredCategories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} level={0} expandedIds={expandedIds} toggleExpand={toggleExpand}
                onEdit={openEditModal} onDelete={handleDelete} onAddSub={openCreateModal} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editingCategory ? 'Modifier' : 'Nouvelle catégorie'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {!editingCategory && selectedParentId && (
                <div className="p-3 bg-brand/5 rounded-xl border border-brand/10">
                  <p className="text-xs text-brand font-medium">Sous-catégorie de : <span className="font-bold">{categories.find(c => c.id === selectedParentId)?.name}</span></p>
                </div>
              )}
              <Input label="Nom *" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Vêtements" autoFocus />
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} />
              </div>
              <Input label="Icône (emoji)" value={formIcon} onChange={e => setFormIcon(e.target.value)} maxLength={5} placeholder="Ex: 👗" />
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={!formName.trim()}><Save className="h-4 w-4 mr-1.5" />{editingCategory ? 'Enregistrer' : 'Créer'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category, level, expandedIds, toggleExpand, onEdit, onDelete, onAddSub }: {
  category: Category; level: number; expandedIds: Set<string>; toggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void; onDelete: (cat: Category) => void; onAddSub: (parentId: string) => void;
}) {
  const hasChildren = (category.children?.length || 0) > 0;
  const isExpanded = expandedIds.has(category.id);
  return (
    <div>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group" style={{ paddingLeft: `${16 + level * 24}px` }}>
        <button onClick={() => hasChildren && toggleExpand(category.id)} className={cn('p-0.5 rounded', hasChildren ? 'text-gray-400 hover:text-gray-600' : 'text-transparent')}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="w-8 h-8 rounded-xl bg-brand/5 flex items-center justify-center text-sm shrink-0">{category.icon || <FolderTree className="h-4 w-4 text-brand" />}</div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.name}</span>
          {category.description && <p className="text-xs text-gray-400 truncate">{category.description}</p>}
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{category.productCount} prod.</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
          <button onClick={() => onAddSub(category.id)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={() => onEdit(category)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(category)} disabled={category.productCount > 0 || hasChildren}
            className={cn('p-1 rounded-lg', category.productCount > 0 || hasChildren ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>{category.children!.map(ch => <CategoryRow key={ch.id} category={ch} level={level + 1} expandedIds={expandedIds} toggleExpand={toggleExpand} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} />)}</div>
      )}
    </div>
  );
}
