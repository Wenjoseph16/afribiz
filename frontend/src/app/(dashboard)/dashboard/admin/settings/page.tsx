'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Save, Globe, DollarSign, CreditCard, Megaphone, 
  BarChart3, Bell, ShoppingCart, Shield, CheckCircle, XCircle, UserCheck,
  Percent,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type SettingsTab = 'general' | 'finances' | 'monetization' | 'subscriptions' | 'ads' | 'afriscore' | 'notifications' | 'marketplace';

const TABS: { id: SettingsTab; label: string; icon: any }[] = [
  { id: 'general', label: 'Général', icon: Globe },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'monetization', label: 'Monétisation', icon: Percent },
  { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
  { id: 'ads', label: 'Publicités', icon: Megaphone },
  { id: 'afriscore', label: 'AfriScore', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
];

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings');
      return res.data.data || {};
    },
    enabled: isAdmin,
  });

  const { data: verificationSettings } = useQuery({
    queryKey: ['admin', 'settings', 'verification'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings/verification');
      return res.data.data || { mode: 'badge_only' };
    },
    enabled: isAdmin,
  });

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (verificationSettings) {
      setForm((prev: any) => ({
        ...prev,
        general: { ...(prev.general || {}), verificationMode: verificationSettings.mode },
      }));
    }
  }, [verificationSettings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const mode = data.general?.verificationMode;
      if (mode) {
        return apiClient.put('/admin/settings/verification', { mode });
      }
      return apiClient.put('/admin/settings', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setToast({ message: 'Paramètres enregistrés avec succès', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Erreur lors de l\'enregistrement', type: 'error' });
    },
  });

  const monetizationMutation = useMutation({
    mutationFn: (data: any) => {
      // Flatten the monetization settings and save them with proper category
      const flatData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        flatData[`monetization_${key}`] = value;
      }
      return apiClient.put('/admin/settings', flatData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setToast({ message: 'Taux de monétisation enregistrés', type: 'success' });
    },
    onError: () => {
      setToast({ message: 'Erreur lors de l\'enregistrement des taux', type: 'error' });
    },
  });

  const updateField = (section: string, field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleSaveMonetization = () => {
    const monetizationData = form.monetization || {};
    monetizationMutation.mutate(monetizationData);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Paramètres</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  if (isLoading) return <Loader className="py-20" />;

  const g = { verificationMode: 'badge_only', ...(form.general || {}) };
  const f = form.finances || {};
  const mo = form.monetization || {};
  const s = form.subscriptions || {};
  const a = form.ads || {};
  const af = form.afriscore || {};
  const n = form.notifications || {};
  const m = form.marketplace || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto font-bold">&times;</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Paramètres</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuration globale de la plateforme</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-3xl">
        {activeTab === 'general' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Général</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom de la plateforme</label>
                <input
                  type="text"
                  value={g.platformName || ''}
                  onChange={(e) => updateField('general', 'platformName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Logo (URL)</label>
                <input
                  type="text"
                  value={g.logoUrl || ''}
                  onChange={(e) => updateField('general', 'logoUrl', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Couleur principale (brand)</label>
                <input
                  type="text"
                  value={g.brandColor || ''}
                  onChange={(e) => updateField('general', 'brandColor', e.target.value)}
                  placeholder="#2563eb"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pays actifs (séparés par des virgules)</label>
                <input
                  type="text"
                  value={Array.isArray(g.activeCountries) ? g.activeCountries.join(', ') : ''}
                  onChange={(e) => updateField('general', 'activeCountries', e.target.value.split(',').map((c: string) => c.trim()))}
                  placeholder="Sénégal, Côte d'Ivoire, Cameroun"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Devise par défaut</label>
                <select
                  value={g.defaultCurrency || 'XOF'}
                  onChange={(e) => updateField('general', 'defaultCurrency', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                >
                  <option value="XOF">XOF (F CFA)</option>
                  <option value="XAF">XAF (F CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                  <option value="GBP">GBP (Livre Sterling)</option>
                </select>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-brand" />
                Vérification d'identité (KYC)
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mode de vérification</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Définit le niveau de vérification requis. En mode badge, le KYC est optionnel et ne bloque jamais l'utilisateur.
                </p>
                <div className="space-y-3">
                  {[
                    { value: 'badge_only', label: 'Badge uniquement', desc: 'KYC optionnel – les vérifiés reçoivent un badge de confiance. Aucun blocage.' },
                    { value: 'recommended', label: 'Recommandé', desc: 'KYC recommandé avec rappels, mais jamais bloquant.' },
                    { value: 'required', label: 'Obligatoire', desc: 'KYC requis pour publier des modules ou recevoir des paiements.' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                      <input
                        type="radio"
                        name="verificationMode"
                        value={opt.value}
                        checked={g.verificationMode === opt.value}
                        onChange={(e) => updateField('general', 'verificationMode', e.target.value)}
                        className="mt-0.5 border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'finances' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Finances</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Taxes (%)</label>
                <input
                  type="number"
                  value={f.taxRate || 0}
                  onChange={(e) => updateField('finances', 'taxRate', Number(e.target.value))}
                  min="0" max="100" step="0.1"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission plateforme (%)</label>
                <input
                  type="number"
                  value={f.platformCommission || 0}
                  onChange={(e) => updateField('finances', 'platformCommission', Number(e.target.value))}
                  min="0" max="100" step="0.1"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seuil paiement escrow</label>
                <input
                  type="number"
                  value={f.escrowThreshold || 0}
                  onChange={(e) => updateField('finances', 'escrowThreshold', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Délai validation paiement (heures)</label>
                <input
                  type="number"
                  value={f.paymentValidationDelay || 24}
                  onChange={(e) => updateField('finances', 'paymentValidationDelay', Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'monetization' && (
          <Card>
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-5 w-5 text-brand" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Taux de commission</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 -mt-3">
                Ces taux sont lus dynamiquement par le backend. Modifiez-les ici pour impacter toute la plateforme sans toucher au code.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission transactions (%)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sur chaque paiement réussi (Mobile Money, Stripe, etc.)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={mo.transactionCommissionRate != null ? mo.transactionCommissionRate * 100 : 1}
                    onChange={(e) => updateField('monetization', 'transactionCommissionRate', Number(e.target.value) / 100)}
                    className="flex-1 accent-brand"
                  />
                  <span className="text-lg font-bold text-brand min-w-[4rem] text-right">
                    {(mo.transactionCommissionRate != null ? mo.transactionCommissionRate * 100 : 1).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission escrow (%)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Frais de tiers de confiance sur chaque libération d'escrow</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={mo.escrowCommissionRate != null ? mo.escrowCommissionRate * 100 : 2}
                    onChange={(e) => updateField('monetization', 'escrowCommissionRate', Number(e.target.value) / 100)}
                    className="flex-1 accent-brand"
                  />
                  <span className="text-lg font-bold text-brand min-w-[4rem] text-right">
                    {(mo.escrowCommissionRate != null ? mo.escrowCommissionRate * 100 : 2).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission modules développeur (%)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Part d'AfriBiz sur les ventes de modules développeurs</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={mo.developerModuleCommissionRate != null ? mo.developerModuleCommissionRate * 100 : 20}
                    onChange={(e) => updateField('monetization', 'developerModuleCommissionRate', Number(e.target.value) / 100)}
                    className="flex-1 accent-brand"
                  />
                  <span className="text-lg font-bold text-brand min-w-[4rem] text-right">
                    {(mo.developerModuleCommissionRate != null ? mo.developerModuleCommissionRate * 100 : 20).toFixed(0)}%
                  </span>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-brand" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Limites des frais escrow</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frais escrow minimum (FCFA)</label>
                  <input
                    type="number"
                    value={mo.minimumEscrowFee || 0}
                    onChange={(e) => updateField('monetization', 'minimumEscrowFee', Number(e.target.value))}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frais escrow maximum (FCFA)</label>
                  <input
                    type="number"
                    value={mo.maximumEscrowFee ?? ''}
                    onChange={(e) => updateField('monetization', 'maximumEscrowFee', e.target.value ? Number(e.target.value) : null)}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">Laissez vide pour illimité</p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-gray-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Information</h3>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Comment ça marche ?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Les taux sont stockés en base de données et lus dynamiquement par le backend.</li>
                  <li>Vous pouvez aussi les gérer via la page <strong>Commissions</strong> pour des règles plus fines (par type de business, etc.).</li>
                  <li>Les valeurs par défaut (1% transactions, 2% escrow) s'appliquent si rien n'est configuré.</li>
                </ul>
              </div>

              <Button onClick={handleSaveMonetization} isLoading={monetizationMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer les taux
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'subscriptions' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Abonnements</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix Business</label>
                <input
                  type="number"
                  value={s.businessPrice || 0}
                  onChange={(e) => updateField('subscriptions', 'businessPrice', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix Développeur</label>
                <input
                  type="number"
                  value={s.developerPrice || 0}
                  onChange={(e) => updateField('subscriptions', 'developerPrice', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix Module Marketplace</label>
                <input
                  type="number"
                  value={s.marketplaceModulePrice || 0}
                  onChange={(e) => updateField('subscriptions', 'marketplaceModulePrice', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix Data Hub Partner</label>
                <input
                  type="number"
                  value={s.dataHubPartnerPrice || 0}
                  onChange={(e) => updateField('subscriptions', 'dataHubPartnerPrice', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'ads' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Publicités</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix minimum campagne</label>
                <input
                  type="number"
                  value={a.minCampaignPrice || 0}
                  onChange={(e) => updateField('ads', 'minCampaignPrice', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <Toggle
                  enabled={a.autoValidation || false}
                  onChange={(v) => updateField('ads', 'autoValidation', v)}
                  label="Validation automatique des campagnes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Formats autorisés</label>
                <div className="space-y-2">
                  {['banner', 'video', 'native', 'popup', 'sidebar'].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Array.isArray(a.allowedFormats) && a.allowedFormats.includes(fmt)}
                        onChange={(e) => {
                          const current = Array.isArray(a.allowedFormats) ? [...a.allowedFormats] : [];
                          const updated = e.target.checked ? [...current, fmt] : current.filter((x: string) => x !== fmt);
                          updateField('ads', 'allowedFormats', updated);
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{fmt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'afriscore' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">AfriScore</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Seuils</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Excellent (&ge;)</label>
                    <input type="number" value={af.excellentThreshold || 90} onChange={(e) => updateField('afriscore', 'excellentThreshold', Number(e.target.value))} min="0" max="100" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Bon (&ge;)</label>
                    <input type="number" value={af.goodThreshold || 70} onChange={(e) => updateField('afriscore', 'goodThreshold', Number(e.target.value))} min="0" max="100" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Moyen (&ge;)</label>
                    <input type="number" value={af.averageThreshold || 40} onChange={(e) => updateField('afriscore', 'averageThreshold', Number(e.target.value))} min="0" max="100" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Faible (&lt;)</label>
                    <input type="number" value={af.lowThreshold || 20} onChange={(e) => updateField('afriscore', 'lowThreshold', Number(e.target.value))} min="0" max="100" className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pondération des composantes (%)</label>
                <div className="space-y-2">
                  {[
                    { key: 'financialWeight', label: 'Financière' },
                    { key: 'socialWeight', label: 'Sociale' },
                    { key: 'activityWeight', label: 'Activité' },
                    { key: 'reputationWeight', label: 'Réputation' },
                  ].map((comp) => (
                    <div key={comp.key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{comp.label}</span>
                      <input
                        type="number"
                        value={af[comp.key] || 25}
                        onChange={(e) => updateField('afriscore', comp.key, Number(e.target.value))}
                        min="0" max="100" step="1"
                        className="w-24 px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Canaux actifs</label>
                <div className="space-y-2">
                  <Toggle enabled={n.emailEnabled || false} onChange={(v) => updateField('notifications', 'emailEnabled', v)} label="Email" />
                  <Toggle enabled={n.smsEnabled || false} onChange={(v) => updateField('notifications', 'smsEnabled', v)} label="SMS" />
                  <Toggle enabled={n.whatsappEnabled || false} onChange={(v) => updateField('notifications', 'whatsappEnabled', v)} label="WhatsApp" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Limite d&apos;envoi (par jour)</label>
                <input
                  type="number"
                  value={n.dailySendLimit || 1000}
                  onChange={(e) => updateField('notifications', 'dailySendLimit', Number(e.target.value))}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'marketplace' && (
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Marketplace</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commission vente (%)</label>
                <input
                  type="number"
                  value={m.saleCommission || 0}
                  onChange={(e) => updateField('marketplace', 'saleCommission', Number(e.target.value))}
                  min="0" max="100" step="0.1"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frais mise en avant</label>
                <input
                  type="number"
                  value={m.featuredFee || 0}
                  onChange={(e) => updateField('marketplace', 'featuredFee', Number(e.target.value))}
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <Toggle
                  enabled={m.autoModuleValidation || false}
                  onChange={(v) => updateField('marketplace', 'autoModuleValidation', v)}
                  label="Validation automatique des modules"
                />
              </div>
              <Button onClick={handleSave} isLoading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
