'use client';

import {
  Package, CreditCard, Truck, CalendarCheck, Car, Users,
  Megaphone, Star, BarChart3,
} from 'lucide-react';
import type { OnboardingData } from '@/types/business';

const ONBOARDING_MODULES = [
  { key: 'PRODUCTS', label: 'Catalogue', desc: 'Produits & services', icon: Package, color: 'emerald', defaultOn: true },
  { key: 'PAYMENT', label: 'Paiement', desc: 'Mobile Money, Cash, Escrow', icon: CreditCard, color: 'blue', defaultOn: true },
  { key: 'DELIVERIES', label: 'Livraison', desc: 'Zones & frais de livraison', icon: Truck, color: 'amber', defaultOn: false },
  { key: 'BOOKINGS', label: 'Réservations', desc: 'Créneaux & calendrier', icon: CalendarCheck, color: 'purple', defaultOn: false },
  { key: 'RENTALS', label: 'Locations', desc: 'Véhicules & équipements', icon: Car, color: 'cyan', defaultOn: false },
  { key: 'AFFILIATE', label: 'Affiliation', desc: 'Parrainage clients', icon: Users, color: 'rose', defaultOn: false },
  { key: 'MARKETING', label: 'Marketing', desc: 'Campagnes & promos', icon: Megaphone, color: 'orange', defaultOn: false },
  { key: 'LOYALTY', label: 'Fidélité', desc: 'Points & récompenses', icon: Star, color: 'yellow', defaultOn: false },
  { key: 'CRM', label: 'CRM', desc: 'Clients & segmentation', icon: BarChart3, color: 'indigo', defaultOn: false },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/30', text: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-100 dark:bg-emerald-900/40', activeBorder: 'border-emerald-400 dark:border-emerald-600', activeText: 'text-emerald-700 dark:text-emerald-300' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/30', text: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-100 dark:bg-blue-900/40', activeBorder: 'border-blue-400 dark:border-blue-600', activeText: 'text-blue-700 dark:text-blue-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/30', text: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-100 dark:bg-amber-900/40', activeBorder: 'border-amber-400 dark:border-amber-600', activeText: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800/30', text: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-100 dark:bg-purple-900/40', activeBorder: 'border-purple-400 dark:border-purple-600', activeText: 'text-purple-700 dark:text-purple-300' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800/30', text: 'text-cyan-600 dark:text-cyan-400', activeBg: 'bg-cyan-100 dark:bg-cyan-900/40', activeBorder: 'border-cyan-400 dark:border-cyan-600', activeText: 'text-cyan-700 dark:text-cyan-300' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/30', text: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-100 dark:bg-rose-900/40', activeBorder: 'border-rose-400 dark:border-rose-600', activeText: 'text-rose-700 dark:text-rose-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800/30', text: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-100 dark:bg-orange-900/40', activeBorder: 'border-orange-400 dark:border-orange-600', activeText: 'text-orange-700 dark:text-orange-300' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800/30', text: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-100 dark:bg-yellow-900/40', activeBorder: 'border-yellow-400 dark:border-yellow-600', activeText: 'text-yellow-700 dark:text-yellow-300' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800/30', text: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-100 dark:bg-indigo-900/40', activeBorder: 'border-indigo-400 dark:border-indigo-600', activeText: 'text-indigo-700 dark:text-indigo-300' },
};

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepModules({ data, onChange }: Props) {
  const toggleModule = (key: string) => {
    const modules = data.modules.includes(key)
      ? data.modules.filter((m) => m !== key)
      : [...data.modules, key];
    onChange({ modules });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Sélectionnez les outils dont vous avez besoin. Vous pourrez en ajouter ou retirer plus tard.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {ONBOARDING_MODULES.map((mod) => {
          const active = data.modules.includes(mod.key);
          const Icon = mod.icon;
          const colors = COLOR_MAP[mod.color] || COLOR_MAP.emerald;

          return (
            <button
              key={mod.key}
              onClick={() => toggleModule(mod.key)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                active
                  ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeText} shadow-sm`
                  : `bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.1]`
              }`}
            >
              {/* Toggle indicator */}
              <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                active
                  ? `${colors.activeBorder} ${colors.activeBg}`
                  : 'border-gray-300 dark:border-white/10'
              }`}>
                {active && (
                  <svg className={`w-3 h-3 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`p-2.5 rounded-xl ${active ? colors.activeBg : colors.bg}`}>
                <Icon className={`h-5 w-5 ${active ? colors.text : colors.text}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{mod.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{mod.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        {data.modules.length} module{data.modules.length > 1 ? 's' : ''} sélectionné{data.modules.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
