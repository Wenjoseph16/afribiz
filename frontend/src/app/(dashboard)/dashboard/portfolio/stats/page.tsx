'use client';

import { useMemo } from 'react';
import { BarChart3, Image, Eye, Heart, TrendingUp, Loader, Target, Award, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { usePortfolioStats, useMyPortfolioItems, usePortfolioCategories } from '@/features/hooks';

export default function PortfolioStatsPage() {
  const { data: statsData, isLoading } = usePortfolioStats();
  const { data: itemsData } = useMyPortfolioItems({ limit: 500 });
  const { data: categoriesData } = usePortfolioCategories();

  const items: any[] = useMemo(() => {
    const raw = Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []);
    return raw;
  }, [itemsData]);

  const categories: any[] = useMemo(() => {
    const raw = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || categoriesData?.data || []);
    return raw;
  }, [categoriesData]);

  const stats = (statsData?.data || statsData) as any || {};

  const totalViews = items.reduce((s: number, i: any) => s + (i.views || i.interactions || 0), 0);
  const totalLikes = items.reduce((s: number, i: any) => s + (i.likes || 0), 0);
  const topItems = [...items].sort((a: any, b: any) => (b.views || b.interactions || 0) - (a.views || a.interactions || 0)).slice(0, 5);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques portfolio</h1>
        <p className="text-sm text-gray-500">Analysez la performance de vos projets et réalisations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand/10"><Image className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Projets</p><p className="text-lg font-bold">{stats.totalItems ?? items.length}</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100"><Eye className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Vues totales</p><p className="text-lg font-bold">{totalViews}</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100"><Heart className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Likes</p><p className="text-lg font-bold">{totalLikes}</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100"><Users className="w-4 h-4 text-purple-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Catégories</p><p className="text-lg font-bold">{stats.totalCategories ?? categories.length}</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4" />Projets les plus vus</h3>
          {topItems.length === 0 ? (
            <p className="text-xs text-gray-500">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item: any, i: number) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
                  )}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                    {item.category && <p className="text-[10px] text-gray-500">{item.category}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{item.views || item.interactions || 0}</p>
                    <p className="text-[10px] text-gray-500">vues</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4" />Répartition par catégorie</h3>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-500">Aucune catégorie</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat: any) => {
                const count = items.filter((i: any) => i.category === cat.name || i.categoryId === cat.id).length;
                const maxCount = Math.max(...categories.map((c: any) => items.filter((i: any) => i.category === c.name || i.categoryId === c.id).length), 1);
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{count} ({items.length > 0 ? Math.round(count / items.length * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${count / maxCount * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Indicateurs clés</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length > 0 ? Math.round(totalViews / items.length) : 0}</p><p className="text-[10px] text-gray-500">Vues / projet</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(1) : '0'}%</p><p className="text-[10px] text-gray-500">Taux engagement</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length > 0 && categories.length > 0 ? (items.length / categories.length).toFixed(1) : '—'}</p><p className="text-[10px] text-gray-500">Projets / catégorie</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{items.filter((i: any) => i.clientName).length}</p><p className="text-[10px] text-gray-500">Avec client</p></div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30">
          <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Suggestions</h3>
          <div className="space-y-2">
            {items.length === 0 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">📷 Ajoutez des projets</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Votre portfolio est vide. Ajoutez vos premières réalisations.</p></div>
            )}
            {categories.length === 0 && items.length > 0 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">🏷️ Organisez vos projets</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Créez des catégories pour mieux organiser votre portfolio.</p></div>
            )}
            {items.length > 0 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">📊 Performance</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{totalViews > 0 ? `${totalViews} vues au total. Les projets les plus performants génèrent le plus d'engagement.` : 'Ajoutez des images et vidéos pour augmenter les interactions.'}</p></div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
