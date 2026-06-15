'use client';

import { useState } from 'react';
import {
  Package, ArrowLeft, Shield, Star, Download, DollarSign,
  MessageSquare, Info, TrendingUp, Percent, Edit3,
  XCircle, Archive, Upload, Save,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PENDING_REVIEW: 'En revue', PUBLISHED: 'Publié', REJECTED: 'Rejeté', ARCHIVED: 'Archivé',
};

const TABS = [
  { id: 'info', label: 'Infos', icon: Info },
  { id: 'revenue', label: 'Revenus', icon: TrendingUp },
  { id: 'commissions', label: 'Commissions', icon: Percent },
  { id: 'reviews', label: 'Avis', icon: MessageSquare },
];

function useModule(id: string) {
  return useQuery({
    queryKey: ['admin', 'modules', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/modules/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function useModuleCommissions(id: string) {
  return useQuery({
    queryKey: ['admin', 'modules', id, 'commissions'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/modules/${id}/commissions`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export default function AdminModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: mod, isLoading } = useModule(id);
  const { data: commissions } = useModuleCommissions(id);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/admin/modules/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'modules', id] }); setEditMode(false); setToast({ message: 'Module mis à jour', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ action }: { action: string }) => apiClient.put(`/admin/modules/${id}/status`, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'modules', id] }); setToast({ message: 'Statut mis à jour', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors du changement de statut', type: 'error' }),
  });

  const enableEdit = () => {
    if (mod) {
      setEditForm({ pricingType: mod.pricingType || '', price: mod.price || 0, commissionRate: mod.commissionRate || 0 });
      setEditMode(true);
    }
  };

  const saveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleStatusAction = (action: string) => {
    const labels: Record<string, string> = { publish: 'publier', archive: 'archiver', reject: 'rejeter' };
    if (!window.confirm(`Êtes-vous sûr de vouloir ${labels[action] || action} ce module ?`)) return;
    statusMutation.mutate({ action });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Détail du module</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur." />
      </div>
    );
  }

  if (isLoading) return <Loader className="py-20" />;
  if (!mod) return <EmptyState icon={<Package className="h-8 w-8" />} title="Module introuvable" description="Ce module n'existe pas." />;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/modules')}>
        <ArrowLeft className="h-4 w-4" /> Retour aux modules
      </Button>

      {/* Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{mod.name}</h1>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[mod.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[mod.status] || mod.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">par {mod.developer?.name || mod.developerId || 'N/A'} · v{mod.version || '1.0.0'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mod.status === 'PENDING_REVIEW' && (
              <>
                <Button size="sm" onClick={() => handleStatusAction('publish')} isLoading={statusMutation.isPending}>
                  <Upload className="h-4 w-4" /> Publier
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleStatusAction('reject')} isLoading={statusMutation.isPending}>
                  <XCircle className="h-4 w-4" /> Rejeter
                </Button>
              </>
            )}
            {mod.status === 'PUBLISHED' && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusAction('archive')} isLoading={statusMutation.isPending}>
                <Archive className="h-4 w-4" /> Archiver
              </Button>
            )}
            {!editMode && (
              <Button variant="secondary" size="sm" onClick={enableEdit}><Edit3 className="h-4 w-4" /> Modifier</Button>
            )}
          </div>
        </div>
      </Card>

      {editMode && (
        <Card title="Modification rapide" titleIcon={<Edit3 className="h-5 w-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de tarification</label>
              <select value={editForm.pricingType} onChange={(e) => setEditForm({ ...editForm, pricingType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                <option value="FREE">Gratuit</option>
                <option value="ONETIME">Paiement unique</option>
                <option value="SUBSCRIPTION">Abonnement</option>
                <option value="FREEMIUM">Freemium</option>
              </select>
            </div>
            <Input label="Prix" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission (%)</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="100" step="0.5" value={editForm.commissionRate}
                  onChange={(e) => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })} className="flex-1 accent-brand" />
                <span className="text-sm font-bold text-brand min-w-[3rem]">{editForm.commissionRate}%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>Annuler</Button>
            <Button size="sm" onClick={saveEdit} isLoading={updateMutation.isPending}><Save className="h-4 w-4" /> Enregistrer</Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Installations', value: mod.installations ?? 0, icon: Download, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
          { label: 'Ventes', value: mod.sales ?? 0, icon: DollarSign, color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
          { label: 'Revenus', value: mod.revenue ? `${Number(mod.revenue).toLocaleString()} FCFA` : '0 FCFA', icon: TrendingUp, color: 'bg-brand-50 dark:bg-brand-900/30 text-brand' },
          { label: 'Note', value: mod.rating ? `${mod.rating.toFixed(1)}/5` : '-', icon: Star, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon({ className: 'h-4 w-4' }) }))}
        activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900 dark:text-gray-100">{mod.description || 'Aucune description.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Catégorie</h3>
                <Badge variant="info" size="sm">{mod.category || 'Non catégorisé'}</Badge>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tarification</h3>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{mod.pricingType || 'FREE'} · {mod.price ? `${mod.price} FCFA` : 'Gratuit'}</p>
              </div>
            </div>
            {mod.features?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Fonctionnalités</h3>
                <div className="flex flex-wrap gap-2">
                  {mod.features.map((f: string, i: number) => (
                    <Badge key={i} variant="success" size="sm">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'revenue' && (
        <Card>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-500">Revenus par période</h3>
            <p className="text-sm text-gray-400 mt-1">Les graphiques de revenus seront disponibles prochainement.</p>
          </div>
        </Card>
      )}

      {activeTab === 'commissions' && (
        <Card>
          {commissions ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 text-center">
                  <p className="text-xs text-gray-500 mb-1">Taux de commission</p>
                  <p className="text-2xl font-bold text-brand">{commissions.rate ?? mod.commissionRate ?? 0}%</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 text-center">
                  <p className="text-xs text-gray-500 mb-1">Montant commission</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{commissions.amount ?? 0} FCFA</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 text-center">
                  <p className="text-xs text-gray-500 mb-1">Montant net</p>
                  <p className="text-2xl font-bold text-emerald-600">{commissions.netAmount ?? 0} FCFA</p>
                </div>
              </div>
              {commissions.transactions?.length > 0 && (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">Transaction</th>
                        <th className="pb-2 font-medium">Montant</th>
                        <th className="pb-2 font-medium">Commission</th>
                        <th className="pb-2 font-medium">Net</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.transactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                          <td className="py-2">{tx.reference || tx.id?.slice(0, 8)}</td>
                          <td className="py-2">{tx.amount ?? '-'} FCFA</td>
                          <td className="py-2">{tx.commission ?? '-'} FCFA</td>
                          <td className="py-2">{tx.netAmount ?? '-'} FCFA</td>
                          <td className="py-2">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Percent className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune donnée de commission disponible.</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'reviews' && (
        <Card>
          {mod.reviews?.length > 0 ? (
            <div className="space-y-4">
              {mod.reviews.map((review: any) => (
                <div key={review.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand">
                        {review.user?.name?.[0] || 'U'}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{review.user?.name || 'Anonyme'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium">{review.rating || 0}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment || review.content || 'Aucun commentaire.'}</p>
                  <p className="text-xs text-gray-400 mt-2">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="Aucun avis" description="Ce module n'a pas encore reçu d'avis." />
          )}
        </Card>
      )}
    </div>
  );
}
