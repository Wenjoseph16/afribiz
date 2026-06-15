'use client';

import { useState } from 'react';
import { Smartphone, Plus, Trash2, CheckCircle2, CreditCard, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import type { OnboardingPaymentMethod } from '@/types/business';

interface Props {
  paymentMethods: OnboardingPaymentMethod[];
  onChange: (methods: OnboardingPaymentMethod[]) => void;
}

const PAYMENT_PROVIDERS = [
  { method: 'TMONEY', name: 'TMoney', icon: Smartphone, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { method: 'FLOOZ', name: 'Flooz', icon: Smartphone, color: 'bg-green-50 text-green-600 border-green-200' },
  { method: 'WAVE', name: 'Wave', icon: Smartphone, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { method: 'MOOV_MONEY', name: 'Moov Money', icon: Smartphone, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { method: 'BANK_TRANSFER', name: 'Virement bancaire', icon: Banknote, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { method: 'CASH', name: 'Espèces', icon: CreditCard, color: 'bg-gray-50 text-gray-600 border-gray-200' },
];

export function StepPayment({ paymentMethods, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  const addMethod = (method: string, name: string) => {
    const existing = paymentMethods.find(m => m.method === method);
    if (existing) {
      setEditing(method);
      return;
    }
    onChange([
      ...paymentMethods,
      { method, name: '', number: '', isActive: true },
    ]);
    setEditing(method);
  };

  const updateMethod = (method: string, field: 'name' | 'number', value: string) => {
    onChange(paymentMethods.map(m =>
      m.method === method ? { ...m, [field]: value } : m
    ));
  };

  const removeMethod = (method: string) => {
    onChange(paymentMethods.filter(m => m.method !== method));
    if (editing === method) setEditing(null);
  };

  const toggleActive = (method: string) => {
    onChange(paymentMethods.map(m =>
      m.method === method ? { ...m, isActive: !m.isActive } : m
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-brand" />
          Moyens de paiement
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configurez les moyens de paiement que vos clients pourront utiliser.
          Vous pourrez les modifier plus tard dans vos paramètres.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
          Conseil
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Activez au moins Mobile Money (TMoney ou Flooz) — c'est le moyen de paiement le plus utilise
          en Afrique de l'Ouest. Wave est aussi tres populaire.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Choisissez vos moyens de paiement
        </p>
        {PAYMENT_PROVIDERS.map(provider => {
          const Icon = provider.icon;
          const existing = paymentMethods.find(m => m.method === provider.method);
          const isEditing = editing === provider.method;
          const isConfigured = existing && existing.name && existing.number;

          return (
            <div key={provider.method}>
              <div
                className={'flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ' + (
                  existing
                    ? isConfigured
                      ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-brand/50 bg-brand/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                )}
                onClick={() => {
                  if (existing) {
                    setEditing(isEditing ? null : provider.method);
                  } else {
                    addMethod(provider.method, provider.name);
                  }
                }}
              >
                <div className={'p-2 rounded-lg ' + provider.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{provider.name}</p>
                  {existing && (
                    <p className="text-xs text-gray-500">
                      {existing.name ? existing.name + ' - ' + existing.number : 'A configurer'}
                    </p>
                  )}
                </div>
                {existing && (
                  <div className="flex items-center gap-2">
                    {isConfigured && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeMethod(provider.method); }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {(isEditing || (existing && !existing.name)) && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-brand/30 space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <Input
                    label="Nom du compte"
                    placeholder="Koffi Kouassi"
                    value={existing?.name || ''}
                    onChange={(e) => updateMethod(provider.method, 'name', e.target.value)}
                  />
                  <Input
                    label="Numero / Identifiant"
                    placeholder={provider.method === 'BANK_TRANSFER' ? 'Numero de compte' : '+228 XX XX XX XX'}
                    value={existing?.number || ''}
                    onChange={(e) => updateMethod(provider.method, 'number', e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={existing?.isActive ?? true}
                        onChange={() => toggleActive(provider.method)}
                        className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Actif</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-xs text-brand font-medium hover:text-brand-700"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {paymentMethods.length === 0
          ? 'Aucun moyen de paiement configure - vous pourrez le faire plus tard'
          : paymentMethods.filter(m => m.name).length + ' moyen(s) de paiement configure(s)'
        }
      </div>
    </div>
  );
}
