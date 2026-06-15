'use client';

import { useState, useMemo, useEffect } from 'react';
import { MessageSquare, Plus, Search, Loader, User, Star, Trash2, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useMyPortfolioItems } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

export default function PortfolioTestimonialsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ content: '', authorName: '', rating: 5, projectId: '' });
  const [creating, setCreating] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: itemsData } = useMyPortfolioItems();

  const items: any[] = useMemo(() => {
    const raw = Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []);
    return raw;
  }, [itemsData]);

  // Fetch testimonials on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getPortfolioTestimonials({ limit: 200 });
        const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.testimonials || []);
        setTestimonials(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const filtered = testimonials.filter((t: any) =>
    !search || t.authorName?.toLowerCase().includes(search.toLowerCase()) || t.content?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.content || !form.authorName) return;
    setCreating(true);
    try {
      await apiClient.createPortfolioTestimonial(form);
      setShowCreate(false);
      setForm({ content: '', authorName: '', rating: 5, projectId: '' });
      const res = await apiClient.getPortfolioTestimonials({ limit: 200 });
      const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.testimonials || []);
      setTestimonials(data);
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try { await apiClient.deletePortfolioTestimonial(id); setTestimonials((prev: any[]) => prev.filter((t: any) => t.id !== id)); } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Témoignages</h1><p className="text-sm text-gray-500">Avis et retours clients mis en avant</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand" /><div><p className="text-[10px] text-gray-500">Total</p><p className="text-lg font-bold">{testimonials.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /><div><p className="text-[10px] text-gray-500">Note moyenne</p><p className="text-lg font-bold">{testimonials.length > 0 ? (testimonials.reduce((s: number, t: any) => s + (t.rating || 5), 0) / testimonials.length).toFixed(1) : '—'}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /><div><p className="text-[10px] text-gray-500">5 étoiles</p><p className="text-lg font-bold">{testimonials.filter((t: any) => t.rating === 5).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /><div><p className="text-[10px] text-gray-500">Auteurs</p><p className="text-lg font-bold">{new Set(testimonials.map((t: any) => t.authorName)).size}</p></div></div></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><MessageSquare className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">{search ? 'Aucun résultat' : 'Aucun témoignage'}</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t: any) => (
            <Card key={t.id} className="p-4 relative">
              <button onClick={() => handleDelete(t.id)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                  {(t.authorName || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.authorName}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn('w-3 h-3', s <= (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">"{t.content}"</p>
              {t.projectId && items.find((i: any) => i.id === t.projectId) && (
                <p className="text-xs text-gray-400 mt-2">— Projet : {items.find((i: any) => i.id === t.projectId)?.title}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nouveau témoignage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Auteur *</label>
                <input type="text" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Témoignage *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note</label>
                  <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Projet lié</label>
                  <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                    <option value="">Aucun</option>
                    {items.map((i: any) => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleCreate} disabled={creating || !form.content || !form.authorName} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {creating ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
