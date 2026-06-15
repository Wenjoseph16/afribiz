'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Car, DollarSign, Package,
  CalendarDays, Image, CheckCircle2, XCircle, Loader,
  History, TrendingUp, Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

type DetailTab = 'info' | 'history';
import { useMyRental, useDeleteRental, useToggleRentalActive } from '@/features/hooks';
import { useRouter } from 'next/navigation';

export default function RentalDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: rental, isLoading, error, refetch } = useMyRental(id);
  const deleteRental = useDeleteRental();
  const toggleActive = useToggleRentalActive();
  const router = useRouter();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [deleting, setDeleting] = useState(false);

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!rental) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Article introuvable</p></div>;

  const r: any = rental;
  const createdDate = r.createdAt ? new Date(r.createdAt) : null;

  const handleDelete = async () => {
    if (!confirm('Supprimer cet article ?')) return;
    setDeleting(true);
    try { await deleteRental.mutateAsync(id); router.push('/dashboard/rentals'); } catch (err) { console.error(err); setDeleting(false); }
  };

  const handleToggle = async () => {
    try { await toggleActive.mutateAsync(id); } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/rentals" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleToggle} disabled={toggleActive.isPending}>
            {r.isActive ? <XCircle className="h-4 w-4 mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
            {r.isActive ? 'Désactiver' : 'Activer'}
          </Button>
          <Link href={`/dashboard/rentals/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{r.name}</h1>
            {r.isActive && r.availableQty < r.quantity / 2 && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">📈 Haute demande</span>
            )}
            {r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-white">🆕 Nouveau</span>
            )}
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{Number(r.price).toLocaleString()} {r.currency} / {r.priceUnit}</div>
              {r.deposit && <div className="flex items-center gap-1.5"><Package className="h-4 w-4" />Caution : {Number(r.deposit).toLocaleString()} {r.currency}</div>}
              <div className="flex items-center gap-1.5"><Package className="h-4 w-4" />Stock : {r.availableQty}/{r.quantity}</div>
            </div>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
            'bg-emerald-500/30 text-white': r.isActive,
            'bg-gray-500/30 text-white': !r.isActive,
          })}>
            {r.isActive ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {([
          { key: 'info', label: 'Informations', icon: Car },
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
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.description || 'Aucune description.'}</p>
            {r.unit && <div className="mt-4"><span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-50 text-brand">{r.unit}</span></div>}
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Prix</span><span className="font-medium text-gray-900 dark:text-gray-100">{Number(r.price).toLocaleString()} {r.currency}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Unité</span><span className="font-medium text-gray-900 dark:text-gray-100">/{r.priceUnit}</span></div>
                {r.deposit && <div className="flex justify-between"><span className="text-gray-500">Caution</span><span className="font-medium text-gray-900 dark:text-gray-100">{Number(r.deposit).toLocaleString()} {r.currency}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Stock</span><span className="font-medium text-gray-900 dark:text-gray-100">{r.availableQty}/{r.quantity}</span></div>
              </div>
            </Card>

            {createdDate && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Informations</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-gray-400" />Créé le {createdDate.toLocaleDateString('fr-FR')}</div>
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
                    {createdDate ? createdDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prix</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(r.price).toLocaleString()} {r.currency}/{r.priceUnit}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stock</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.availableQty}/{r.quantity} disponible{r.quantity > 1 ? 's' : ''}</p>
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
                    {createdDate ? (() => {
                      const diff = now.getTime() - createdDate.getTime();
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
                { date: createdDate, label: 'Article ajouté à la location', icon: History },
                { date: r.updatedAt ? new Date(r.updatedAt) : null, label: 'Dernière modification', icon: TrendingUp },
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
