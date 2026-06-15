'use client';

import { useState } from 'react';
import {
  CreditCard, Plus, Edit3, Trash2, Shield, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Star, Globe, Calendar,
  Users, BookOpen, Hash,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const PLAN_TYPES = ['STANDARD', 'PREMIUM', 'VIP', 'ENTERPRISE', 'UNLIMITED', 'FREE_TRIAL'];

const TYPE_BADGES: Record<string, { variant: 'brand' | 'success' | 'info' | 'purple' | 'warning' | 'default'; label: string }> = {
  STANDARD: { variant: 'default', label: 'Standard' },
  PREMIUM: { variant: 'brand', label: 'Premium' },
  VIP: { variant: 'purple', label: 'VIP' },
  ENTERPRISE: { variant: 'warning', label: 'Entreprise' },
  UNLIMITED: { variant: 'success', label: 'Illimité' },
  FREE_TRIAL: { variant: 'info', label: 'Essai gratuit' },
};

const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'YEARLY', 'LIFETIME'];
const CURRENCIES = ['XAF', 'XOF', 'EUR', 'USD'];

const emptyPlan = {
  name: '', type: 'STANDARD', price: 0, currency: 'XAF',
  billingCycle: 'MONTHLY', trialDays: 0, durationDays: 30,
  maxUsage: 0, maxClients: 0, maxBookings: 0,
  benefits: [] as string[],
  isPublic: true, isActive: true, featured: false, badge: '',
};

const emptyPrivilege = { code: '', label: '', description: '', value: '' };

function usePlans() {
  return useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/subscription-plans');
      return res.data.data;
    },
  });
}

export default function AdminSubscriptionPlansPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [planForm, setPlanForm] = useState<any>(emptyPlan);
  const [newBenefit, setNewBenefit] = useState('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [privilegeModal, setPrivilegeModal] = useState<{ open: boolean; planId?: string; edit?: any }>({ open: false });
  const [privForm, setPrivForm] = useState<any>(emptyPrivilege);

  const { data: plansData, isLoading } = usePlans();
  const plans = Array.isArray(plansData) ? plansData : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/subscription-plans', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setModal({ open: false }); setToast({ message: 'Plan créé avec succès', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la création', type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/admin/subscription-plans/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setModal({ open: false }); setToast({ message: 'Plan mis à jour avec succès', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/subscription-plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setToast({ message: 'Plan supprimé avec succès', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la suppression', type: 'error' }),
  });

  const addPrivilegeMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => apiClient.post(`/admin/subscription-plans/${planId}/privileges`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setPrivilegeModal({ open: false }); setPrivForm(emptyPrivilege); setToast({ message: 'Privilège ajouté', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de l\'ajout du privilège', type: 'error' }),
  });

  const updatePrivilegeMutation = useMutation({
    mutationFn: ({ planId, id, data }: { planId: string; id: string; data: any }) => apiClient.put(`/admin/subscription-plans/${planId}/privileges/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setPrivilegeModal({ open: false }); setPrivForm(emptyPrivilege); setToast({ message: 'Privilège mis à jour', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }),
  });

  const deletePrivilegeMutation = useMutation({
    mutationFn: ({ planId, id }: { planId: string; id: string }) => apiClient.delete(`/admin/subscription-plans/${planId}/privileges/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] }); setToast({ message: 'Privilège supprimé', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la suppression', type: 'error' }),
  });

  const openCreate = () => { setPlanForm(emptyPlan); setNewBenefit(''); setModal({ open: true }); };
  const openEdit = (plan: any) => { setPlanForm({ ...plan, benefits: plan.benefits || [] }); setNewBenefit(''); setModal({ open: true, edit: plan }); };

  const handleSavePlan = () => {
    if (modal.edit) {
      updateMutation.mutate({ id: modal.edit.id, data: planForm });
    } else {
      createMutation.mutate(planForm);
    }
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (!window.confirm(`Supprimer le plan « ${name} » ?`)) return;
    deleteMutation.mutate(id);
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setPlanForm({ ...planForm, benefits: [...(planForm.benefits || []), newBenefit.trim()] });
      setNewBenefit('');
    }
  };

  const removeBenefit = (idx: number) => {
    setPlanForm({ ...planForm, benefits: planForm.benefits.filter((_: any, i: number) => i !== idx) });
  };

  const openAddPrivilege = (planId: string) => { setPrivForm(emptyPrivilege); setPrivilegeModal({ open: true, planId }); };
  const openEditPrivilege = (planId: string, priv: any) => { setPrivForm(priv); setPrivilegeModal({ open: true, planId, edit: priv }); };

  const handleSavePrivilege = () => {
    if (!privilegeModal.planId) return;
    if (privilegeModal.edit) {
      updatePrivilegeMutation.mutate({ planId: privilegeModal.planId, id: privilegeModal.edit.id, data: privForm });
    } else {
      addPrivilegeMutation.mutate({ planId: privilegeModal.planId, data: privForm });
    }
  };

  const handleDeletePrivilege = (planId: string, privId: string, label: string) => {
    if (!window.confirm(`Supprimer le privilège « ${label} » ?`)) return;
    deletePrivilegeMutation.mutate({ planId, id: privId });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Plans d&apos;abonnement</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Plans d&apos;abonnement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez les plans et leurs privilèges</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau plan</Button>
      </div>

      {isLoading ? (
        <Loader className="py-20" />
      ) : plans.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-8 w-8" />} title="Aucun plan" description="Créez votre premier plan d'abonnement." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Créer un plan</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan: any) => {
            const tb = TYPE_BADGES[plan.type] || { variant: 'default', label: plan.type };
            const isExpanded = expandedPlan === plan.id;
            return (
              <Card key={plan.id} padding="md" className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                      <Badge variant={tb.variant} size="xs">{tb.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.featured && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
                    {plan.isPublic ? <Globe className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                    {plan.isActive ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  </div>
                </div>

                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {plan.price?.toLocaleString()} <span className="text-sm font-normal text-gray-500">{plan.currency}</span>
                  <span className="text-sm font-normal text-gray-500 ml-1">/{plan.billingCycle?.toLowerCase()}</span>
                </div>

                {plan.badge && <Badge variant="brand" size="xs">{plan.badge}</Badge>}

                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  {plan.trialDays > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" /> {plan.trialDays} jours d&apos;essai
                    </div>
                  )}
                  {plan.maxUsage > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Hash className="h-3.5 w-3.5" /> Max {plan.maxUsage} utilisations
                    </div>
                  )}
                  {plan.maxClients > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Users className="h-3.5 w-3.5" /> {plan.maxClients} clients
                    </div>
                  )}
                  {plan.maxBookings > 0 && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" /> {plan.maxBookings} réservations
                    </div>
                  )}
                </div>

                {plan.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {plan.benefits.map((b: string, i: number) => (
                      <Badge key={i} variant="success" size="xs">{b}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="ghost" size="xs" onClick={() => openEdit(plan)}><Edit3 className="h-3.5 w-3.5" /> Modifier</Button>
                  <Button variant="ghost" size="xs" onClick={() => handleDeletePlan(plan.id, plan.name)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  <Button variant="ghost" size="xs" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} className="ml-auto">
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    Privilèges
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    {plan.privileges?.map((priv: any) => (
                      <div key={priv.id} className="flex items-start justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{priv.label}</p>
                          <p className="text-xs text-gray-500">{priv.description}</p>
                          {priv.value && <Badge variant="info" size="xs">{priv.value}</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => openEditPrivilege(plan.id, priv)}><Edit3 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="xs" onClick={() => handleDeletePrivilege(plan.id, priv.id, priv.label)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="secondary" size="xs" fullWidth onClick={() => openAddPrivilege(plan.id)}><Plus className="h-3 w-3" /> Ajouter un privilège</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Modifier le plan' : 'Créer un plan'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <select value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
              {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Prix" type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Devise</label>
            <select value={planForm.currency} onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cycle de facturation</label>
            <select value={planForm.billingCycle} onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
              {BILLING_CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Jours d'essai" type="number" value={planForm.trialDays} onChange={(e) => setPlanForm({ ...planForm, trialDays: Number(e.target.value) })} />
          <Input label="Durée (jours)" type="number" value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })} />
          <Input label="Utilisation max" type="number" value={planForm.maxUsage} onChange={(e) => setPlanForm({ ...planForm, maxUsage: Number(e.target.value) })} />
          <Input label="Clients max" type="number" value={planForm.maxClients} onChange={(e) => setPlanForm({ ...planForm, maxClients: Number(e.target.value) })} />
          <Input label="Réservations max" type="number" value={planForm.maxBookings} onChange={(e) => setPlanForm({ ...planForm, maxBookings: Number(e.target.value) })} />
          <Input label="Badge texte" value={planForm.badge} onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })} />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6 mt-4">
          {['isPublic', 'isActive', 'featured'].map((field) => (
            <label key={field} className="flex items-center gap-3 cursor-pointer">
              <button type="button" role="switch" aria-checked={planForm[field]}
                onClick={() => setPlanForm({ ...planForm, [field]: !planForm[field] })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${planForm[field] ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${planForm[field] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{field === 'isPublic' ? 'Public' : field === 'isActive' ? 'Actif' : 'En vedette'}</span>
            </label>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Avantages</label>
          <div className="flex gap-2 mb-2">
            <Input value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Saisir un avantage..." onKeyDown={(e) => e.key === 'Enter' && addBenefit()} />
            <Button variant="secondary" onClick={addBenefit}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {planForm.benefits?.map((b: string, i: number) => (
              <Badge key={i} variant="success" removable onRemove={() => removeBenefit(i)}>{b}</Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>Annuler</Button>
          <Button onClick={handleSavePlan} isLoading={createMutation.isPending || updateMutation.isPending}>
            {modal.edit ? 'Mettre à jour' : 'Créer le plan'}
          </Button>
        </div>
      </Modal>

      {/* Privilege Modal */}
      <Modal open={privilegeModal.open} onClose={() => setPrivilegeModal({ open: false })} title={privilegeModal.edit ? 'Modifier le privilège' : 'Ajouter un privilège'} size="md">
        <div className="space-y-4">
          <Input label="Code" value={privForm.code} onChange={(e) => setPrivForm({ ...privForm, code: e.target.value })} placeholder="ex: CAN_EXPORT_DATA" />
          <Input label="Libellé" value={privForm.label} onChange={(e) => setPrivForm({ ...privForm, label: e.target.value })} placeholder="Exporter des données" />
          <Input label="Description" value={privForm.description} onChange={(e) => setPrivForm({ ...privForm, description: e.target.value })} />
          <Input label="Valeur" value={privForm.value} onChange={(e) => setPrivForm({ ...privForm, value: e.target.value })} placeholder="ex: 1000" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={() => setPrivilegeModal({ open: false })}>Annuler</Button>
          <Button onClick={handleSavePrivilege} isLoading={addPrivilegeMutation.isPending || updatePrivilegeMutation.isPending}>
            {privilegeModal.edit ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
