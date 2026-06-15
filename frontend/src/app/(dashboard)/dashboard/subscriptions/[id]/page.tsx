'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Clock, Users, CreditCard,
  Trash2, Loader, CheckCircle, History, TrendingUp, Activity,
  CalendarDays, Repeat,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

type DetailTab = 'info' | 'history';
import { useSubscriptionPlan, useDeleteSubscriptionPlan } from '@/features/hooks';
import { useRouter } from 'next/navigation';

const DURATION_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  BIANNUAL: 'Semestriel',
  ANNUAL: 'Annuel',
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: plan, isLoading, error, refetch } = useSubscriptionPlan(id);
  const deletePlan = useDeleteSubscriptionPlan();
  const router = useRouter();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [deleting, setDeleting] = useState(false);

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!plan) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Plan introuvable</p></div>;

  const p: any = plan;

  const handleDelete = async () => {
    if (!confirm('Supprimer ce plan d\'abonnement ?')) return;
    setDeleting(true);
    try { await deletePlan.mutateAsync(id); router.push('/dashboard/subscriptions'); } catch { setDeleting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/subscriptions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/subscriptions/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" />{deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{p.name}</h1>
            {(p.subscriberCount || 0) >= 50 && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/30 text-white">🔥 Populaire</span>
            )}
            {p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">🆕 Nouveau</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{Number(p.price).toLocaleString()} FCFA</span>
              <span className="text-lg opacity-80">/{DURATION_LABELS[p.duration]?.toLowerCase() || p.duration.toLowerCase()}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1.5"><Users className="h-4 w-4" />{p.subscriberCount || 0} abonné{(p.subscriberCount || 0) !== 1 ? 's' : ''}</div>
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{DURATION_LABELS[p.duration] || p.duration}</div>
              {p.subscriberCount > 0 && (
                <div className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" />Revenu : {(Number(p.price) * (p.subscriberCount || 0)).toLocaleString()} FCFA</div>
              )}
            </div>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
            'bg-emerald-500/30 text-white': p.status === 'ACTIVE',
            'bg-gray-500/30 text-white': p.status === 'INACTIVE',
          })}>
            {p.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {([
          { key: 'info', label: 'Informations', icon: Repeat },
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
          <Card padding="lg" className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{p.description || 'Aucune description.'}</p>

            {p.features && p.features.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Fonctionnalités incluses</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium text-gray-900 dark:text-gray-100">{DURATION_LABELS[p.duration] || p.duration}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Abonnés</span><span className="font-medium text-gray-900 dark:text-gray-100">{p.subscriberCount || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Max employés</span><span className="font-medium text-gray-900 dark:text-gray-100">{p.maxEmployees || 'Illimité'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Stockage</span><span className="font-medium text-gray-900 dark:text-gray-100">{p.maxStorage ? `${p.maxStorage} Go` : 'Illimité'}</span></div>
                {p.subscriberCount > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Revenu estimé</span><span className="font-medium text-gray-900 dark:text-gray-100">{(Number(p.price) * (p.subscriberCount || 0)).toLocaleString()} FCFA</span></div>
                )}
              </div>
            </Card>
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
                  <p className="text-xs text-gray-500">Date de création</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Abonnés</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.subscriberCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prix</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(p.price).toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Âge du plan</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.createdAt ? (() => {
                      const diff = now.getTime() - new Date(p.createdAt).getTime();
                      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
                      if (days >= 365) return `${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? 's' : ''}`;
                      if (days >= 30) return `${Math.floor(days / 30)} mois`;
                      return `${days} jour${days > 1 ? 's' : ''}`;
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
                { date: p.createdAt ? new Date(p.createdAt) : null, label: 'Plan créé', icon: History },
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
