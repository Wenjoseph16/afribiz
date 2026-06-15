'use client';

import { useState, useMemo } from 'react';
import { Image, Plus, Search, Loader, Trash2, X, Film, Grid3X3, LayoutGrid } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import { useMyPortfolioItems } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

export default function PortfolioMediaPage() {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ itemId: '', url: '', type: 'image', caption: '' });
  const [uploading, setUploading] = useState(false);
  const [medias, setMedias] = useState<Record<string, any[]>>({});
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: itemsData, isLoading } = useMyPortfolioItems({ limit: 200 });

  const items: any[] = useMemo(() => {
    const raw = Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []);
    return raw;
  }, [itemsData]);

  const loadMedias = async (itemId: string) => {
    setSelectedItem(itemId);
    if (medias[itemId]) return;
    setLoadingMedia(true);
    try {
      const item = items.find((i: any) => i.id === itemId);
      const existingMedias: any[] = [];
      if (item?.images) {
        existingMedias.push(...item.images.map((url: string) => ({ id: url, url, type: 'image', caption: '' })));
      }
      if (item?.videos) {
        existingMedias.push(...item.videos.map((url: string) => ({ id: url, url, type: 'video', caption: '' })));
      }
      setMedias(prev => ({ ...prev, [itemId]: existingMedias }));
    } catch (err) { console.error(err); }
    setLoadingMedia(false);
  };

  const handleUpload = async () => {
    if (!form.url || !form.itemId) return;
    setUploading(true);
    try {
      await apiClient.post('/business/portfolio/media', { itemId: form.itemId, url: form.url, type: form.type, caption: form.caption });
      setShowUpload(false);
      setForm({ itemId: '', url: '', type: 'image', caption: '' });
      setMedias(prev => ({ ...prev, [selectedItem || '']: [] }));
      if (selectedItem) loadMedias(selectedItem);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleDelete = async (itemId: string, mediaUrl: string) => {
    // Save previous state for rollback
    const prevMedias = medias[itemId] || [];
    try {
      // Optimistically remove from local state
      setMedias(prev => ({ ...prev, [itemId]: (prev[itemId] || []).filter((m: any) => m.url !== mediaUrl) }));
      // Update the portfolio item to remove the media URL
      const currentItem = items.find((i: any) => i.id === itemId);
      if (currentItem) {
        const newImages = (currentItem.images || []).filter((u: string) => u !== mediaUrl);
        const newVideos = (currentItem.videos || []).filter((u: string) => u !== mediaUrl);
        await apiClient.updatePortfolioItem(itemId, { images: newImages, videos: newVideos });
      }
    } catch (err) {
      // Rollback on error
      setMedias(prev => ({ ...prev, [itemId]: prevMedias }));
      console.error(err);
    }
  };

  const filteredItems = items.filter((i: any) =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
  );

  const allMedias = selectedItem ? (medias[selectedItem] || []) : [];

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Média & Galerie</h1><p className="text-sm text-gray-500">Gérez les images et vidéos de vos projets</p></div>
        {selectedItem && (
          <Button size="sm" onClick={() => { setForm(f => ({ ...f, itemId: selectedItem })); setShowUpload(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />Ajouter média
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><Image className="w-4 h-4 text-brand" /><div><p className="text-[10px] text-gray-500">Projets</p><p className="text-lg font-bold">{items.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Image className="w-4 h-4 text-blue-500" /><div><p className="text-[10px] text-gray-500">Avec médias</p><p className="text-lg font-bold">{items.filter((i: any) => i.image || i.images?.length || i.videos?.length).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Film className="w-4 h-4 text-purple-500" /><div><p className="text-[10px] text-gray-500">Vidéos</p><p className="text-lg font-bold">{items.filter((i: any) => i.videos?.length).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><Film className="w-4 h-4 text-amber-500" /><div><p className="text-[10px] text-gray-500">Fichiers</p><p className="text-lg font-bold">{Object.values(medias).flat().length}</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list sidebar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher projet..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredItems.map((item: any) => (
              <button key={item.id} onClick={() => loadMedias(item.id)}
                className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-sm transition-colors',
                  selectedItem === item.id ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}>
                {item.image ? (
                  <NextImage src={item.image} alt="" width={32} height={32} className="rounded-lg object-cover shrink-0" unoptimized />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0"><Image className="w-4 h-4 text-brand" /></div>
                )}
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Media grid */}
        <div className="lg:col-span-2">
          {!selectedItem ? (
            <Card className="text-center py-12"><Image className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Sélectionnez un projet pour voir ses médias</p></Card>
          ) : loadingMedia ? (
            <div className="flex items-center justify-center min-h-[200px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
          ) : allMedias.length === 0 ? (
            <Card className="text-center py-12">
              <Image className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Aucun média dans ce projet</p>
              <Button size="sm" onClick={() => { setForm(f => ({ ...f, itemId: selectedItem })); setShowUpload(true); }}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {items.find((i: any) => i.id === selectedItem)?.title} — {allMedias.length} média(s)
                </h3>
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={cn('p-1.5', viewMode === 'grid' ? 'bg-brand text-white' : 'text-gray-500')}><Grid3X3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setViewMode('list')} className={cn('p-1.5', viewMode === 'list' ? 'bg-brand text-white' : 'text-gray-500')}><LayoutGrid className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allMedias.map((media: any, i: number) => (
                    <div key={i} className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {media.type === 'video' ? (
                        <video src={media.url} className="w-full h-full object-cover" controls />
                      ) : (
                        <NextImage src={media.url} alt={media.caption || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => handleDelete(selectedItem, media.url)} className="p-2 rounded-lg bg-red-500 text-white"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      {media.caption && <p className="absolute bottom-0 left-0 right-0 p-1.5 text-[10px] text-white bg-gradient-to-t from-black/60 bg-transparent">{media.caption}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {allMedias.map((media: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 relative">
                        {media.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center"><Film className="w-5 h-5 text-purple-500" /></div>
                        ) : (
                          <NextImage src={media.url} alt="" fill className="object-cover" sizes="48px" unoptimized />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{media.url}</p>
                        {media.caption && <p className="text-[10px] text-gray-400">{media.caption}</p>}
                      </div>
                      <Badge variant="info" size="xs">{media.type === 'video' ? 'Vidéo' : 'Image'}</Badge>
                      <button onClick={() => handleDelete(selectedItem, media.url)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ajouter un média</h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  <option value="image">Image</option>
                  <option value="video">Vidéo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL *</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Légende</label>
                <input type="text" value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleUpload} disabled={uploading || !form.url} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {uploading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
