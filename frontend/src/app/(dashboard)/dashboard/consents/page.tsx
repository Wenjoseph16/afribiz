'use client';

import { useState } from 'react';
import {
  Shield, Eye, EyeOff, CheckCircle, XCircle, Plus, Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useBusinessStore } from '@/stores/businessStore';
import {
  useMyConsents, useUpdateConsent, useRevokeConsent, useCreateConsent,
} from '@/features/afriScoreHooks';

const PARTNER_TYPES: Record<string, string> = {
  BANK: 'Banque',
  INSURANCE: 'Assurance',
  INVESTOR: 'Investisseur',
  PUBLIC_INSTITUTION: 'Institution publique',
  OTHER: 'Autre',
};

const SHARE_LEVELS = [
  { value: 'NONE', label: 'Aucun partage', desc: 'Ne partager aucune donnée' },
  { value: 'SCORE_ONLY', label: 'Score uniquement', desc: 'Partager seulement le score agrégé' },
  { value: 'ANONYMIZED', label: 'Données anonymisées', desc: 'Partager des données anonymisées pour analyse' },
  { value: 'DETAILED', label: 'Données détaillées', desc: 'Partager toutes les données (avec consentement explicite)' },
];

const CATEGORIES = [
  { value: 'FINANCIAL', label: 'Données financières', desc: 'Transactions, revenus, paiements' },
  { value: 'COMMERCIAL', label: 'Données commerciales', desc: 'Commandes, produits, clients' },
  { value: 'OPERATIONAL', label: 'Données opérationnelles', desc: 'Performance, délais, fiabilité' },
  { value: 'PROFILE', label: 'Données de profil', desc: 'Informations du business' },
];

export default function ConsentsPage() {
  const { business } = useBusinessStore();
  const { data: consentsData, isLoading, error, refetch } = useMyConsents();
  const updateConsentMutation = useUpdateConsent();
  const revokeConsentMutation = useRevokeConsent();
  const createConsentMutation = useCreateConsent();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConsent, setNewConsent] = useState({ category: 'FINANCIAL', level: 'SCORE_ONLY', partnerTypes: [] as string[] });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const consents = Array.isArray(consentsData) ? consentsData : consentsData?.consents ?? [];

  const handleLevelChange = async (id: string, level: string, partnerTypes: string[]) => {
    try {
      await updateConsentMutation.mutateAsync({ id, data: { level, partnerTypes } });
      setToast({ message: 'Consentement mis à jour', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeConsentMutation.mutateAsync(id);
      setToast({ message: 'Consentement révoqué', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la révocation', type: 'error' });
    }
  };

  const handleCreate = async () => {
    if (newConsent.partnerTypes.length === 0) return;
    try {
      await createConsentMutation.mutateAsync(newConsent);
      setShowCreateForm(false);
      setNewConsent({ category: 'FINANCIAL', level: 'SCORE_ONLY', partnerTypes: [] });
      setToast({ message: 'Consentement créé', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la création', type: 'error' });
    }
  };

  const togglePartnerType = (type: string) => {
    setNewConsent((prev) => ({
      ...prev,
      partnerTypes: prev.partnerTypes.includes(type)
        ? prev.partnerTypes.filter((t) => t !== type)
        : [...prev.partnerTypes, type],
    }));
  };

  if (isLoading) return <Loader className="min-h-[60vh]" />;

  if (!business) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des consentements
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Aucun business"
          description="Activez votre business pour gérer vos consentements de partage de données."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Consentements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Contrôlez les données partagées avec les partenaires
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4" />
          Nouveau consentement
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau consentement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Catégorie</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setNewConsent((p) => ({ ...p, category: cat.value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newConsent.category === cat.value
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Niveau de partage</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SHARE_LEVELS.map((sl) => (
                  <button
                    key={sl.value}
                    onClick={() => setNewConsent((p) => ({ ...p, level: sl.value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newConsent.level === sl.value
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sl.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{sl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Types de partenaires autorisés</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PARTNER_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => togglePartnerType(key)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      newConsent.partnerTypes.includes(key)
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleCreate}>Créer le consentement</Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Annuler</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Consents list */}
      {consents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {consents.map((consent: any) => {
            const category = CATEGORIES.find((c) => c.value === consent.category);
            const shareLevel = SHARE_LEVELS.find((s) => s.value === consent.level);
            const isActive = consent.status !== 'REVOKED';

            return (
              <Card key={consent.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{category?.label || consent.category}</p>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <CheckCircle className="h-3 w-3" /> Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                            <XCircle className="h-3 w-3" /> Révoqué
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{category?.desc}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-900/20 border-brand/20 text-brand'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                        }`}>
                          {shareLevel?.label || consent.level}
                        </span>
                        {(consent.partnerTypes || []).map((pt: string) => (
                          <span key={pt} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {PARTNER_TYPES[pt] || pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRevoke(consent.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Aucun consentement"
          description="Créez votre premier consentement pour contrôler le partage de vos données."
          action={
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4" />
              Créer un consentement
            </Button>
          }
        />
      )}
    </div>
  );
}
