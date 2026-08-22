'use client';

import {
  Package,
  Wrench,
  BookOpen,
  Bed,
  CalendarCheck,
  ShoppingCart,
  FileText,
  CreditCard,
  Percent,
  Clock,
  Users,
  Briefcase,
  Repeat,
  Truck,
  Calendar,
  Key,
  Folder,
  Handshake,
  AlertTriangle,
  Globe,
  Layers,
  GraduationCap,
} from 'lucide-react';
import type { OnboardingData } from '@/types/business';
import { BUSINESS_TYPE_LABELS } from '@/constants/business';

const ONBOARDING_MODULES = [
  {
    key: 'PRODUCTS',
    label: 'Produits',
    desc: 'Catalogue produits',
    icon: Package,
    color: 'emerald',
    defaultOn: false,
  },
  {
    key: 'SERVICES',
    label: 'Services',
    desc: 'Prestations & devis',
    icon: Wrench,
    color: 'blue',
    defaultOn: false,
  },
  {
    key: 'MENU',
    label: 'Menu / Carte',
    desc: 'Carte restaurant / bar',
    icon: BookOpen,
    color: 'orange',
    defaultOn: false,
  },
  {
    key: 'ROOMS',
    label: 'Chambres',
    desc: 'Hébergement & réservation',
    icon: Bed,
    color: 'purple',
    defaultOn: false,
  },
  {
    key: 'BOOKINGS',
    label: 'Réservations',
    desc: 'Créneaux & calendrier',
    icon: CalendarCheck,
    color: 'indigo',
    defaultOn: false,
  },
  {
    key: 'ORDERS',
    label: 'Commandes',
    desc: 'Suivi des ventes',
    icon: ShoppingCart,
    color: 'emerald',
    defaultOn: false,
  },
  {
    key: 'QUOTES_INVOICES',
    label: 'Devis & Factures',
    desc: 'Facturation pro',
    icon: FileText,
    color: 'blue',
    defaultOn: false,
  },
  {
    key: 'DEBTS_PAYMENTS',
    label: 'Dettes & Paiements',
    desc: 'Crédit & encaissements',
    icon: CreditCard,
    color: 'amber',
    defaultOn: false,
  },
  {
    key: 'PROMOTIONS',
    label: 'Promotions',
    desc: 'Offres & réductions',
    icon: Percent,
    color: 'rose',
    defaultOn: false,
  },
  {
    key: 'PLANNING',
    label: 'Planning',
    desc: 'Emploi du temps & équipe',
    icon: Clock,
    color: 'cyan',
    defaultOn: false,
  },
  {
    key: 'EMPLOYEES',
    label: 'Employés',
    desc: 'Gestion & permissions',
    icon: Users,
    color: 'violet',
    defaultOn: false,
  },
  {
    key: 'PORTFOLIO',
    label: 'Portfolio',
    desc: 'Réalisations & projets',
    icon: Briefcase,
    color: 'teal',
    defaultOn: false,
  },
  {
    key: 'SUBSCRIPTIONS',
    label: 'Abonnements',
    desc: 'Offres récurrentes',
    icon: Repeat,
    color: 'blue',
    defaultOn: false,
  },
  {
    key: 'DELIVERIES',
    label: 'Livraisons',
    desc: 'Zones & frais de livraison',
    icon: Truck,
    color: 'amber',
    defaultOn: false,
  },
  {
    key: 'EVENTS',
    label: 'Événements',
    desc: 'Événements & billetterie',
    icon: Calendar,
    color: 'pink',
    defaultOn: false,
  },
  {
    key: 'RENTALS',
    label: 'Locations',
    desc: 'Véhicules & équipements',
    icon: Key,
    color: 'cyan',
    defaultOn: false,
  },
  {
    key: 'DOCUMENTS',
    label: 'Documents',
    desc: 'Contrats & fichiers',
    icon: Folder,
    color: 'gray',
    defaultOn: false,
  },
  {
    key: 'PARTNERS',
    label: 'Partenaires',
    desc: 'Fournisseurs & alliances',
    icon: Handshake,
    color: 'emerald',
    defaultOn: false,
  },
  {
    key: 'DISPUTES',
    label: 'Litiges',
    desc: 'Gestion des réclamations',
    icon: AlertTriangle,
    color: 'red',
    defaultOn: false,
  },
  {
    key: 'MODULE_MARKETPLACE',
    label: 'Marketplace',
    desc: 'Vente multi-vendeurs',
    icon: Globe,
    color: 'indigo',
    defaultOn: false,
  },
  {
    key: 'ADVANCED_TASKS',
    label: 'Tâches avancées',
    desc: 'Kanban & projet',
    icon: Layers,
    color: 'slate',
    defaultOn: false,
  },
  {
    key: 'TRAINING',
    label: 'Formations',
    desc: 'Cours & certifications',
    icon: GraduationCap,
    color: 'violet',
    defaultOn: false,
  },
];

const COLOR_MAP: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
  }
> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    activeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    activeBorder: 'border-emerald-400 dark:border-emerald-600',
    activeText: 'text-emerald-700 dark:text-emerald-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/30',
    text: 'text-blue-600 dark:text-blue-400',
    activeBg: 'bg-blue-100 dark:bg-blue-900/40',
    activeBorder: 'border-blue-400 dark:border-blue-600',
    activeText: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/30',
    text: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeBorder: 'border-amber-400 dark:border-amber-600',
    activeText: 'text-amber-700 dark:text-amber-300',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/30',
    text: 'text-purple-600 dark:text-purple-400',
    activeBg: 'bg-purple-100 dark:bg-purple-900/40',
    activeBorder: 'border-purple-400 dark:border-purple-600',
    activeText: 'text-purple-700 dark:text-purple-300',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    activeBorder: 'border-cyan-400 dark:border-cyan-600',
    activeText: 'text-cyan-700 dark:text-cyan-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800/30',
    text: 'text-rose-600 dark:text-rose-400',
    activeBg: 'bg-rose-100 dark:bg-rose-900/40',
    activeBorder: 'border-rose-400 dark:border-rose-600',
    activeText: 'text-rose-700 dark:text-rose-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800/30',
    text: 'text-orange-600 dark:text-orange-400',
    activeBg: 'bg-orange-100 dark:bg-orange-900/40',
    activeBorder: 'border-orange-400 dark:border-orange-600',
    activeText: 'text-orange-700 dark:text-orange-300',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    activeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    activeBorder: 'border-yellow-400 dark:border-yellow-600',
    activeText: 'text-yellow-700 dark:text-yellow-300',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    activeBorder: 'border-indigo-400 dark:border-indigo-600',
    activeText: 'text-indigo-700 dark:text-indigo-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800/30',
    text: 'text-violet-600 dark:text-violet-400',
    activeBg: 'bg-violet-100 dark:bg-violet-900/40',
    activeBorder: 'border-violet-400 dark:border-violet-600',
    activeText: 'text-violet-700 dark:text-violet-300',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800/30',
    text: 'text-teal-600 dark:text-teal-400',
    activeBg: 'bg-teal-100 dark:bg-teal-900/40',
    activeBorder: 'border-teal-400 dark:border-teal-600',
    activeText: 'text-teal-700 dark:text-teal-300',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800/30',
    text: 'text-pink-600 dark:text-pink-400',
    activeBg: 'bg-pink-100 dark:bg-pink-900/40',
    activeBorder: 'border-pink-400 dark:border-pink-600',
    activeText: 'text-pink-700 dark:text-pink-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/30',
    text: 'text-red-600 dark:text-red-400',
    activeBg: 'bg-red-100 dark:bg-red-900/40',
    activeBorder: 'border-red-400 dark:border-red-600',
    activeText: 'text-red-700 dark:text-red-300',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800/30',
    text: 'text-gray-600 dark:text-gray-400',
    activeBg: 'bg-gray-100 dark:bg-gray-900/40',
    activeBorder: 'border-gray-400 dark:border-gray-600',
    activeText: 'text-gray-700 dark:text-gray-300',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800/30',
    text: 'text-slate-600 dark:text-slate-400',
    activeBg: 'bg-slate-100 dark:bg-slate-900/40',
    activeBorder: 'border-slate-400 dark:border-slate-600',
    activeText: 'text-slate-700 dark:text-slate-300',
  },
};

const FOOD_TYPES = ['RESTAURANT', 'FAST_FOOD', 'PATISSERIE', 'BOULANGERIE', 'CAFE', 'BAR'];
const STAY_TYPES = ['HOTEL', 'AUBERGE', 'MAISON_D_HOTES', 'LOCATION_SAISONNIERE'];
const RETAIL_TYPES = [
  'BOUTIQUE_VETEMENTS',
  'BOUTIQUE_CHAUSSURES',
  'BOUTIQUE_COSMETIQUES',
  'BOUTIQUE_INFORMATIQUE',
  'BOUTIQUE_TELEPHONIQUE',
  'BOUTIQUE_ELECTRONIQUE',
  'SUPERMARCHE',
  'EPICERIE',
  'PHARMACIE',
  'LIBRAIRIE',
  'PAPETERIE',
];
const BEAUTY_TYPES = ['SALON_COIFFURE', 'SALON_BEAUTE', 'SPA', 'INSTITUT_ESTHETIQUE'];
const CREATIVE_TYPES = [
  'PHOTOGRAPHE',
  'VIDEOASTE',
  'AGENCE_MARKETING',
  'AGENCE_COMMUNICATION',
  'AGENCE_DIGITALE',
  'DEVELOPPEUR',
  'DESIGNER_GRAPHIQUE',
  'FREELANCE',
];
const OFFICE_TYPES = [
  'CABINET_JURIDIQUE',
  'CABINET_COMPTABLE',
  'CABINET_CONSEIL',
  'CONSULTANT',
  'COACH_PROFESSIONNEL',
];
const HEALTH_TYPES = ['CABINET_MEDICAL', 'CLINIQUE'];
const EDUCATION_TYPES = ['CENTRE_FORMATION', 'ECOLE_PRIVEE'];
const CRAFT_TYPES = [
  'ARTISAN',
  'MENUISIER',
  'MACON',
  'PLOMBIER',
  'ELECTRICIEN',
  'SOUDEUR',
  'MECANICIEN',
];
const AGRI_TYPES = ['ENTREPRISE_AGRICOLE', 'ELEVAGE'];

const MODULES_BY_TYPE: Record<string, string[]> = {
  food: ['MENU', 'ORDERS', 'PROMOTIONS', 'DELIVERIES'],
  stay: ['ROOMS', 'BOOKINGS', 'PROMOTIONS'],
  retail: ['PRODUCTS', 'ORDERS', 'PROMOTIONS', 'DELIVERIES'],
  beauty: ['SERVICES', 'BOOKINGS', 'EMPLOYEES'],
  creative: ['PORTFOLIO', 'QUOTES_INVOICES', 'ADVANCED_TASKS'],
  office: ['BOOKINGS', 'QUOTES_INVOICES', 'DOCUMENTS'],
  health: ['BOOKINGS', 'EMPLOYEES', 'DOCUMENTS'],
  education: ['TRAINING', 'SUBSCRIPTIONS', 'BOOKINGS'],
  craft: ['PORTFOLIO', 'QUOTES_INVOICES', 'BOOKINGS'],
  agri: ['PRODUCTS', 'ORDERS', 'DELIVERIES'],
};

function suggestedGroup(typeId: string): string[] | null {
  if (FOOD_TYPES.includes(typeId)) return MODULES_BY_TYPE.food;
  if (STAY_TYPES.includes(typeId)) return MODULES_BY_TYPE.stay;
  if (RETAIL_TYPES.includes(typeId)) return MODULES_BY_TYPE.retail;
  if (BEAUTY_TYPES.includes(typeId)) return MODULES_BY_TYPE.beauty;
  if (CREATIVE_TYPES.includes(typeId)) return MODULES_BY_TYPE.creative;
  if (OFFICE_TYPES.includes(typeId)) return MODULES_BY_TYPE.office;
  if (HEALTH_TYPES.includes(typeId)) return MODULES_BY_TYPE.health;
  if (EDUCATION_TYPES.includes(typeId)) return MODULES_BY_TYPE.education;
  if (CRAFT_TYPES.includes(typeId)) return MODULES_BY_TYPE.craft;
  if (AGRI_TYPES.includes(typeId)) return MODULES_BY_TYPE.agri;
  return null;
}

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

  const suggested = data.typeId ? suggestedGroup(data.typeId) : null;
  const pendingSuggestions = (suggested || []).filter((k) => !data.modules.includes(k));
  const typeLabel = BUSINESS_TYPE_LABELS[data.typeId] || '';

  const addAllSuggestions = () => {
    onChange({ modules: Array.from(new Set([...data.modules, ...(suggested || [])])) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Sélectionnez les outils dont vous avez besoin. Vous pourrez en ajouter ou retirer plus tard.
      </p>

      {pendingSuggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/40">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Recommandé pour {typeLabel.toLowerCase()}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Les modules les plus utilisés par les businesses similaires.
              </p>
            </div>
            <button
              onClick={addAllSuggestions}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0"
            >
              Tout ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {pendingSuggestions.map((key) => {
              const mod = ONBOARDING_MODULES.find((m) => m.key === key);
              if (!mod) return null;
              const Icon = mod.icon;
              return (
                <button
                  key={key}
                  onClick={() => toggleModule(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-white/10 border border-emerald-200 dark:border-emerald-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-emerald-400 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {mod.label}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <div
                className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  active
                    ? `${colors.activeBorder} ${colors.activeBg}`
                    : 'border-gray-300 dark:border-white/10'
                }`}
              >
                {active && (
                  <svg
                    className={`w-3 h-3 ${colors.text}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              <div className={`p-2.5 rounded-xl ${active ? colors.activeBg : colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
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
        {data.modules.length} module{data.modules.length > 1 ? 's' : ''} sélectionné
        {data.modules.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
