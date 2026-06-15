'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Percent, Gift, Tag, CalendarDays, Clock,
  Trash2, Loader, Copy, History, TrendingUp, Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

type DetailTab = 'info' | 'history';
import { useMyPromotion, useDeletePromotion } from '@/features/hooks';
import { useRouter } from 'next/navigation';

const typeLabels: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_SHIPPING: 'Livraison offerte',
  BUY_X_GET_Y: 'Acheté 1 offert',
};

export default function PromotionDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: promotion, isLoading, error, refetch } = useMyPromotion(id);
  const deletePromotion = useDeletePromotion();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!params?.id) return null;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!promotion) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Promotion introuvable</p></div>;

  const p: any = promotion;
  const now = new Date();
  const startsAt = p.startsAt ? new Date(p.startsAt) : null;
  const endsAt = p.endsAt ? new Date(p.endsAt) : null;
  const isExpired = endsAt && endsAt <= now;
  const isActive = p.isActive && !isExpired;

  const handleDelete = async () => {
    if (!confirm('Supprimer cette promotion ?')) return;
    setDeleting(true);
    try { await deletePromotion.mutateAsync(id); router.push('/dashboard/promotions'); } catch (err) { console.error(err); setDeleting(false); }
  };

  const copyCode = async () => {
    if (p.code) {
      try { await navigator.clipboard.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/promotions" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/promotions/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" />{deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className={cn('rounded-2xl p-8 text-white', {
        'bg-gradient-to-br from-brand-700 to-amber-800': p.discountType === 'PERCENTAGE',
        'bg-gradient-to-br from-emerald-700 to-teal-800': p.discountType === 'FREE_SHIPPING',
        'bg-gradient-to-br from-purple-700 to-pink-800': p.discountType === 'BUY_X_GET_Y',
        'bg-gradient-to-br from-blue-700 to-indigo-800': p.discountType === 'FIXED',
      })}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                {p.discountType === 'PERCENTAGE' ? <Percent className="h-6 w-6" /> :
                 p.discountType === 'FREE_SHIPPING' ? <Gift className="h-6 w-6" /> :
                 <Tag className="h-6 w-6" />}
              </div>
              <h1 className="text-3xl font-bold">{p.title}</h1>
              {p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">🆕 Nouvelle</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                {typeLabels[p.discountType] || p.discountType}
              </span>
              <span className="font-bold text-2xl">
                {p.discountValue}{p.discountType === 'PERCENTAGE' ? '%' : ' FCFA'}
              </span>
            </div>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
            'bg-emerald-500/30 text-white': isActive,
            'bg-red-500/30 text-white': !p.isActive,
            'bg-gray-500/30 text-white': isExpired,
          })}>
            {isExpired ? 'Expirée' : isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {([
          { key: 'info', label: 'Informations', icon: Percent },
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
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{typeLabels[p.discountType] || p.discountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valeur</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{p.discountValue}{p.discountType === 'PERCENTAGE' ? '%' : ' FCFA'}</span>
                </div>
                {p.minPurchase && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Achat min</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{Number(p.minPurchase).toLocaleString()} FCFA</span>
                  </div>
                )}
                {p.maxDiscount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Réduction max</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{Number(p.maxDiscount).toLocaleString()} FCFA</span>
                  </div>
                )}
                {p.usageLimit && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Limite d'utilisation</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{p.usageLimit}</span>
                  </div>
                )}
              </div>
            </Card>

            {p.code && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Code promo</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-brand px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30">{p.code}</span>
                  <button onClick={copyCode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {copied && <p className="text-xs text-emerald-600 mt-1">Copié !</p>}
              </Card>
            )}

            {(startsAt || endsAt) && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Période de validité</h3>
                <div className="text-sm space-y-2">
                  {startsAt && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Début : {startsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  {endsAt && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Fin : {endsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
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
                  <Percent className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{typeLabels[p.discountType] || p.discountType}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Tag className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valeur</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.discountValue}{p.discountType === 'PERCENTAGE' ? '%' : ' FCFA'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Âge</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {p.createdAt ? (() => {
                      const diff = now.getTime() - new Date(p.createdAt).getTime();
                      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
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
                { date: p.createdAt ? new Date(p.createdAt) : null, label: 'Promotion créée', icon: History },
                { date: startsAt, label: 'Début de validité', icon: TrendingUp },
                { date: endsAt, label: 'Fin de validité', icon: Clock },
                { date: p.updatedAt ? new Date(p.updatedAt) : null, label: 'Dernière modification', icon: Pencil },
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
