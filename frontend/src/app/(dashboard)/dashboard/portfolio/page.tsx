'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Image, Plus, Search, Grid3X3, List, Eye, Pencil, Trash2,
  Briefcase, Folder, MessageSquare, MousePointerClick, Loader2,
  Sparkles, AlertTriangle, Zap, Award,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import { useMyPortfolioItems, useDeletePortfolioItem, usePortfolioStats } from '@/features/hooks';

interface PortfolioItem {
  id: string; title: string; description: string | null;
  category: string | null; image: string | null;
  clientName: string | null; projectDate: string | null;
  tags: string[]; interactions: number;
  createdAt?: string;
}

export default function PortfolioPage() {
  const { data: itemsData, isLoading, error, refetch } = useMyPortfolioItems();
  const { data: statsData } = usePortfolioStats();
  const deleteItem = useDeletePortfolioItem();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allItems: PortfolioItem[] = Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []);

  const stats = statsData || {
    total: allItems.length,
    categories: [...new Set(allItems.map(i => i.category).filter(Boolean))].length,
    testimonials: 0,
    interactions: allItems.reduce((s, i) => s + (i.interactions || 0), 0),
  };

  const filtered = useMemo(() => {
    let f = [...allItems];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q) || i.tags?.some(t => t.toLowerCase().includes(q)));
    }
    return f;
  }, [allItems, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet élément du portfolio ?')) return;
    try { await deleteItem.mutateAsync(id); } catch (err) { console.error(err); }
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos réalisations et projets</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/portfolio/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvel élément</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Briefcase className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total projets" value={stats.total} />
        <StatsCard icon={<Folder className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Catégories" value={stats.categories} />
        <StatsCard icon={<MessageSquare className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Témoignages" value={stats.testimonials} />
        <StatsCard icon={<MousePointerClick className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Interactions" value={stats.interactions} />
      </div>

      {/* Suggestions intelligentes */}
      {allItems.length > 0 && (() => {
        const popular = allItems.filter(i => (i.interactions || 0) >= 100);
        const noDescription = allItems.filter(i => !i.description);
        const categories = [...new Set(allItems.map(i => i.category).filter(Boolean))];
        const recent = allItems.filter(i => i.projectDate && new Date(i.projectDate) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000));

        const suggestions = [
          popular.length > 0 && {
            type: 'popular', icon: Award,
            title: `${popular.length} projet${popular.length > 1 ? 's' : ''} populaire${popular.length > 1 ? 's' : ''}`,
            desc: 'Fort engagement — mettez-les en avant sur votre page publique',
            color: 'emerald',
          },
          noDescription.length > 0 && {
            type: 'no_description', icon: AlertTriangle,
            title: `${noDescription.length} projet${noDescription.length > 1 ? 's' : ''} sans description`,
            desc: 'Ajoutez une description pour améliorer le référencement',
            color: 'amber',
          },
          categories.length > 0 && {
            type: 'categories', icon: Zap,
            title: `${categories.length} catégorie${categories.length > 1 ? 's' : ''}`,
            desc: categories.slice(0, 3).join(', ') + (categories.length > 3 ? ` et +${categories.length - 3}` : ''),
            color: 'purple',
          },
          recent.length > 0 && {
            type: 'recent', icon: Sparkles,
            title: `${recent.length} projet${recent.length > 1 ? 's' : ''} récent${recent.length > 1 ? 's' : ''}`,
            desc: 'Ajoutés ou mis à jour récemment dans votre portfolio',
            color: 'blue',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={s.link || '/dashboard/portfolio'}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un projet..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <EmptyState
            icon={<Briefcase className="h-8 w-8" />}
            title="Aucun projet trouvé"
            description={searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre première réalisation'}
            action={<Link href="/dashboard/portfolio/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvel élément</Button></Link>}
          />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <PortfolioCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Projet</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((item) => (
                <PortfolioRow key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadges(item: PortfolioItem) {
  const badges: { label: string; class: string }[] = [];
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const isPopular = (item.interactions || 0) >= 100;
  const isRecent = item.projectDate && new Date(item.projectDate) > sixMonthsAgo;
  const isNew = item.createdAt && new Date(item.createdAt) > sixMonthsAgo;
  if (isPopular) badges.push({ label: '🔥 Populaire', class: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300' });
  if (isRecent) badges.push({ label: '🆕 Récent', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' });
  if (isNew) badges.push({ label: '✨ Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' });
  return badges;
}

function PortfolioCard({ item, onDelete }: { item: PortfolioItem; onDelete: (id: string) => Promise<void> }) {
  const badges = getBadges(item);
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-900/20 dark:to-amber-900/20 flex items-center justify-center overflow-hidden relative">
        {item.image ? (
          <NextImage src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        ) : (
          <Image className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        )}
        {badges.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm">{b.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{item.title}</h3>
        {item.category && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Folder className="h-3.5 w-3.5" />
            {item.category}
          </div>
        )}
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tag}</span>
            ))}
            {item.tags.length > 3 && <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            {item.interactions || 0} interactions
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/portfolio/${item.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/dashboard/portfolio/${item.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioRow({ item, onDelete }: { item: PortfolioItem; onDelete: (id: string) => Promise<void> }) {
  const badges = getBadges(item);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0 overflow-hidden relative">
            {item.image ? (
              <NextImage src={item.image} alt={item.title} fill className="object-cover" sizes="40px" unoptimized />
            ) : (
              <Image className="h-5 w-5 text-brand" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
            <p className="text-xs text-gray-500">{item.description || 'Aucune description'}</p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {badges.map((b, i) => (
                  <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{b.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{item.category || '-'}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{item.clientName || '-'}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {item.projectDate ? new Date(item.projectDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
        </span>
      </td>
      <td className="p-4 text-center">
        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-center">
            {item.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tag}</span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/portfolio/${item.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/portfolio/${item.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
