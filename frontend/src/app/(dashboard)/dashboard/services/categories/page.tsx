'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, FolderTree, ChevronRight, ChevronDown, Search, X, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory } from '@/features/hooks';

interface Cat { id: string; name: string; slug: string; description?: string; icon?: string; parentId: string | null; sortOrder: number; isActive: boolean; serviceCount: number; children?: Cat[]; }

export default function ServiceCategoriesPage() {
  const { data: catsData, isLoading } = useServiceCategories();
  const createCat = useCreateServiceCategory();
  const updateCat = useUpdateServiceCategory();
  const deleteCat = useDeleteServiceCategory();
  const [cats, setCats] = useState<Cat[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (catsData) {
      const arr = Array.isArray(catsData) ? catsData : (catsData?.items || catsData?.data || []);
      setCats(arr);
    }
  }, [catsData]);

  const stats = useMemo(() => ({ total: cats.reduce((a, c) => a + 1 + (c.children?.length || 0), 0), totalServices: cats.reduce((a, c) => a + c.serviceCount + (c.children?.reduce((s, ch) => s + ch.serviceCount, 0) || 0), 0) }), [cats]);

  const filtered = useMemo(() => {
    if (!search) return cats;
    const q = search.toLowerCase();
    return cats.filter(c => c.name.toLowerCase().includes(q) || c.children?.some(ch => ch.name.toLowerCase().includes(q))).map(c => ({ ...c, children: c.children?.filter(ch => ch.name.toLowerCase().includes(q)) }));
  }, [cats, search]);

  const toggleExpand = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openCreate = (pid: string | null = null) => { setEditing(null); setParentId(pid); setName(''); setDesc(''); setIcon(''); setModal(true); };
  const openEdit = (cat: Cat) => { setEditing(cat); setParentId(cat.parentId); setName(cat.name); setDesc(cat.description || ''); setIcon(cat.icon || ''); setModal(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateCat.mutateAsync({ id: editing.id, data: { name: name.trim(), description: desc, icon } });
      } else {
        await createCat.mutateAsync({ name: name.trim(), description: desc, icon, parentId });
      }
      setModal(false);
    } catch (err) {
      // handled by hook
    }
  };

  const handleDelete = async (cat: Cat) => {
    if (cat.serviceCount > 0 || (cat.children?.length || 0) > 0) return;
    try {
      await deleteCat.mutateAsync(cat.id);
    } catch (err) {
      // handled by hook
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4"><Link href="/dashboard/services" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link><div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Catégories services</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organisez vos services par catégories</p></div></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm" className="text-center"><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-xs text-gray-500 mt-0.5">Catégories</p></Card>
        <Card padding="sm" className="text-center"><p className="text-2xl font-bold text-brand">{stats.totalServices}</p><p className="text-xs text-gray-500 mt-0.5">Services dans ces catégories</p></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-800 dark:text-gray-100" /></div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><FolderTree className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-4">Aucune catégorie</p><Button onClick={() => openCreate(null)}><Plus className="h-4 w-4 mr-1.5" />Créer</Button></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(cat => <CatRow key={cat.id} cat={cat} level={0} expanded={expanded} toggleExpand={toggleExpand} onEdit={openEdit} onDelete={handleDelete} onAddSub={openCreate} />)}
          </div>
        )}
      </div>

      <div className="flex justify-end"><Button onClick={() => openCreate(null)}><Plus className="h-4 w-4 mr-1.5" />Nouvelle catégorie</Button></div>

      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border w-full max-w-lg mx-4 p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-gray-900">{editing ? 'Modifier' : 'Nouvelle catégorie'}</h2><button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-5 w-5" /></button></div>
          <div className="space-y-4">
            {!editing && parentId && <div className="p-3 bg-brand/5 rounded-xl border border-brand/10"><p className="text-xs text-brand font-medium">Sous-catégorie</p></div>}
            <Input label="Nom *" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <div><label className="block text-sm font-medium mb-2">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} /></div>
            <Input label="Icône (emoji)" value={icon} onChange={e => setIcon(e.target.value)} maxLength={5} placeholder="Ex: 💇, 🧴, 🎯" />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t"><Button variant="outline" onClick={() => setModal(false)}>Annuler</Button><Button onClick={handleSave} isLoading={createCat.isPending || updateCat.isPending} disabled={!name.trim()}>{editing ? 'Enregistrer' : 'Créer'}</Button></div>
        </div>
      </div>}
    </div>
  );
}

function CatRow({ cat, level, expanded, toggleExpand, onEdit, onDelete, onAddSub }: { cat: Cat; level: number; expanded: Set<string>; toggleExpand: (id: string) => void; onEdit: (c: Cat) => void; onDelete: (c: Cat) => void; onAddSub: (pid: string) => void }) {
  const hasChildren = (cat.children?.length || 0) > 0;
  const isExpanded = expanded.has(cat.id);
  return (
    <div>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group" style={{ paddingLeft: `${16 + level * 24}px` }}>
        <button onClick={() => hasChildren && toggleExpand(cat.id)} className={cn('p-0.5 rounded', hasChildren ? 'text-gray-400 hover:text-gray-600' : 'text-transparent')}>{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
        <div className="w-8 h-8 rounded-xl bg-brand/5 flex items-center justify-center text-sm shrink-0">{cat.icon || <FolderTree className="h-4 w-4 text-brand" />}</div>
        <div className="flex-1 min-w-0"><span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{cat.name}</span>{cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}</div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full shrink-0">{cat.serviceCount} serv.</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onAddSub(cat.id)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={() => onEdit(cat)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(cat)} disabled={cat.serviceCount > 0 || hasChildren} className={cn('p-1 rounded-lg', cat.serviceCount > 0 || hasChildren ? 'text-gray-200 dark:text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {hasChildren && isExpanded && <div>{cat.children!.map(ch => <CatRow key={ch.id} cat={ch} level={level + 1} expanded={expanded} toggleExpand={toggleExpand} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} />)}</div>}
    </div>
  );
}
