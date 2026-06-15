'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Trash2, CalendarDays, User, Tag, MousePointerClick,
  ExternalLink, Loader2, Image as ImageIcon,
  History, TrendingUp, Activity, Briefcase,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

type DetailTab = 'info' | 'history';
import Image from 'next/image';
import { useMyPortfolioItem, useDeletePortfolioItem } from '@/features/hooks';

export default function PortfolioDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: item, isLoading, error, refetch } = useMyPortfolioItem(id);
  const deleteItem = useDeletePortfolioItem();
  const router = useRouter();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [deleting, setDeleting] = useState(false);

  if (!params || !id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!item) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Élément introuvable</p></div>;

  const p: any = item;

  const handleDelete = async () => {
    if (!confirm('Supprimer cet élément du portfolio ?')) return;
    setDeleting(true);
    try { await deleteItem.mutateAsync(id); router.push('/dashboard/portfolio'); } catch (err) { console.error(err); setDeleting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/portfolio" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/portfolio/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" />{deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-amber-800 p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{p.title}</h1>
              {(p.interactions || 0) >= 100 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/30 text-white">🔥 Populaire</span>
              )}
              {p.projectDate && new Date(p.projectDate) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-white">🆕 Récent</span>
              )}
            </div>
            {p.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                {p.category}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm">
            <MousePointerClick className="h-4 w-4" />
            {p.interactions || 0} interactions
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {([
          { key: 'info', label: 'Informations', icon: Briefcase },
          { key: 'history', label: 'Historique', icon: History },
        ] as { key: DetailTab; label: string; icon: any }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="md:col-span-2 space-y-6">
            {p.image && (
              <div className="rounded-xl overflow-hidden relative">
                <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{p.description || 'Aucune description.'}</p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                {p.clientName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100">{p.clientName}</span>
                  </div>
                )}
                {p.projectDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(p.projectDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {p.projectUrl && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                    <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline truncate">
                      Voir le projet
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-900 dark:text-gray-100">{p.interactions || 0} interactions</span>
                </div>
              </div>
            </Card>

            {p.tags && p.tags.length > 0 && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  <Tag className="h-4 w-4 inline mr-1" />Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <CalendarDays className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date du projet</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.projectDate ? new Date(p.projectDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{p.clientName || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <MousePointerClick className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Interactions</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.interactions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Âge du projet</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.projectDate ? (() => {
                      const diff = now.getTime() - new Date(p.projectDate).getTime();
                      const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
                      if (months >= 12) return `${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? 's' : ''}`;
                      if (months >= 1) return `${months} mois`;
                      return 'Moins d\'un mois';
                    })() : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Chronologie</h3>
            <div className="space-y-3">
              {[
                { date: p.createdAt ? new Date(p.createdAt) : null, label: 'Projet ajouté au portfolio', icon: History },
                { date: p.projectDate ? new Date(p.projectDate) : null, label: 'Date du projet', icon: CalendarDays },
                { date: p.updatedAt ? new Date(p.updatedAt) : null, label: 'Dernière modification', icon: TrendingUp },
              ].filter(item => item.date).map((item, i, arr) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                      i === 0 ? 'bg-brand-100 dark:bg-brand-900/30 text-brand' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    {i < arr.length - 1 && <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                    <p className="text-xs text-gray-500">
                      {item.date?.toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
