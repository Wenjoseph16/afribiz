'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Star, Clock, MapPin, Users, Loader, Scissors,
  Trash2, Copy, EyeOff, Eye, BarChart3, MessageSquare, Calendar,
  TrendingUp, Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
  useMyService, useDeleteService, useToggleServiceActive, useDuplicateService,
} from '@/features/hooks';

type TabType = 'overview' | 'employees' | 'bookings' | 'reviews' | 'stats' | 'history';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: s, isLoading, refetch } = useMyService(id);
  const deleteService = useDeleteService();
  const toggleActive = useToggleServiceActive();
  const duplicate = useDuplicateService();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteService.mutateAsync(id);
    router.push('/dashboard/services');
  };

  const isPopular = (s?.bookingCount || 0) >= 20;
  const isRecommended = (s?.rating || 0) >= 4.5 && (s?.reviewCount || 0) >= 5;
  const isNewService = s?.createdAt && (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30;

  const handleToggle = async () => {
    await toggleActive.mutateAsync(id);
    refetch();
  };

  const handleDuplicate = async () => {
    await duplicate.mutateAsync(id);
    router.push('/dashboard/services');
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!s) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Service introuvable</p></div>;

  const fmtPrice = (p: number) => (p || 0).toLocaleString() + ' FCFA';
  const fmtDur = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + m % 60 + 'min' : ''}` : `${m} min`;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Aperçu', icon: <Eye className="h-4 w-4" /> },
    { id: 'employees', label: 'Employés', icon: <Users className="h-4 w-4" /> },
    { id: 'bookings', label: 'Réservations', icon: <Calendar className="h-4 w-4" /> },
    { id: 'reviews', label: 'Avis', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'history', label: 'Historique', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{s.name}</h1>
              <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                {s.isActive ? 'Actif' : 'Inactif'}
              </span>
              {s.isPromotional && <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">PROMO</span>}
              {isPopular && <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">🔥 Populaire</span>}
              {isRecommended && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">⭐ Recommandé</span>}
              {isNewService && <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">🆕 Nouveau</span>}
              {s.featured && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-600 rounded-full">À la une</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {s.category?.name || 'Sans catégorie'} · {s.locationType === 'ONLINE' ? 'En ligne' : s.locationType === 'AT_HOME' ? 'À domicile' : s.locationType === 'HYBRID' ? 'Hybride' : 'Sur place'}
              {(s.priceType === 'VARIABLE' || s.priceType === 'FROM') && ' · Prix variable'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleToggle} isLoading={toggleActive.isPending}>
            {s.isActive ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
            {s.isActive ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDuplicate} isLoading={duplicate.isPending}>
            <Copy className="h-4 w-4 mr-1.5" />Dupliquer
          </Button>
          <Link href={`/dashboard/services/${id}/edit`}>
            <Button size="sm"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)} isLoading={deleteService.isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {s.priceType === 'VARIABLE' ? `${fmtPrice(s.minPrice || s.price || 0)}` : fmtPrice(s.price || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {s.isPromotional && s.promotionalPrice
              ? <><span className="line-through text-gray-400">{fmtPrice(s.price || 0)}</span> → <span className="text-red-500 font-bold">{fmtPrice(s.promotionalPrice)}</span></>
              : 'Prix'}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-brand">{fmtDur(s.duration || 0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Durée{s.durationMin && s.durationMax ? ` (${fmtDur(s.durationMin)} - ${fmtDur(s.durationMax)})` : ''}</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-gray-900">{s.bookingCount || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Réservations</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-amber-500">{s.rating ? s.rating.toFixed(1) : '-'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Note ({s.reviewCount || 0} avis)</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-1.5 px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {s.description || s.shortDescription || 'Aucune description fournie'}
                </p>
              </div>
              {(s.tags || []).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(s.tags || []).map((t: string) => (
                      <span key={t} className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">#{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500">Disponibilité</p>
                  <p className="text-sm font-semibold mt-0.5">{s.availability === 'ALWAYS' ? 'Tous les jours' : s.availability === 'CUSTOM' ? 'Personnalisé' : 'Sur rendez-vous'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500">Lieu</p>
                  <p className="text-sm font-semibold mt-0.5">{s.locationType === 'ONLINE' ? 'En ligne' : s.locationType === 'AT_HOME' ? 'À domicile' : s.locationType === 'HYBRID' ? 'Hybride' : 'Sur place'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500">Réservation</p>
                  <p className="text-sm font-semibold mt-0.5">{s.bookingRequired ? 'Obligatoire' : 'Facultative'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500">Acompte</p>
                  <p className="text-sm font-semibold mt-0.5">{s.depositRequired ? `${s.depositAmount?.toLocaleString()} FCFA` : 'Non requis'}</p>
                </div>
              </div>
              {(s.seoTitle || s.seoDescription) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <h4 className="text-xs font-semibold text-blue-600 mb-2">SEO</h4>
                  {s.seoTitle && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="text-gray-400">Titre:</span> {s.seoTitle}</p>}
                  {s.seoDescription && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1"><span className="text-gray-400">Description:</span> {s.seoDescription}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <div>
              {(!s.employees || s.employees.length === 0) ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun employé assigné à ce service</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(s.employees || []).filter((e: any) => e.isActive !== false).map((emp: any) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{emp.name}</p>
                        {emp.title && <p className="text-xs text-gray-500">{emp.title}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Liste des réservations pour ce service</p>
              <p className="text-xs text-gray-400 mt-1">{s.bookingCount || 0} réservation(s) au total</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {(!s.reviews || s.reviews.length === 0) ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(s.reviews || []).map((review: any) => (
                    <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                          {review.user?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.user?.firstName} {review.user?.lastName}</p>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={cn('h-3 w-3', i < review.rating ? 'fill-current' : 'text-gray-200')} />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">{review.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-brand/5 rounded-xl">
                  <p className="text-2xl font-bold text-brand">{s.bookingCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Réservations</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{s.rating ? s.rating.toFixed(1) : '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Note moyenne</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{s.reviewCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Avis</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{s.employees?.length || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Employés</p>
                </div>
              </div>
              {s.bookingCount > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    Revenu estimé : <span className="font-bold text-gray-900 dark:text-gray-100">
                      {(s.price || 0) * (s.bookingCount || 0)} FCFA
                    </span>
                    {s.isPromotional && s.promotionalPrice && (
                      <span> (promo : {s.promotionalPrice * (s.bookingCount || 0)} FCFA)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Service créé</p>
                  <p className="text-xs text-gray-500">Le {new Date(s.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              {s.updatedAt && s.updatedAt !== s.createdAt && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dernière modification</p>
                    <p className="text-xs text-gray-500">Le {new Date(s.updatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Performance</p>
                  <p className="text-xs text-gray-500">{s.bookingCount || 0} réservation(s) · {s.reviewCount || 0} avis · Note: {s.rating || '-'}/5</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Âge du service</p>
                  <p className="text-xs text-gray-500">
                    {s.createdAt
                      ? `${Math.round((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours en catalogue`
                      : 'Date inconnue'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <div><h2 className="text-lg font-bold text-gray-900">Supprimer ce service ?</h2><p className="text-sm text-gray-500">Cette action est irréversible</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-6">Le service <strong>{s.name}</strong> sera supprimé définitivement.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
              <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
