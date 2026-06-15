'use client';

import { useState } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterState = {
  type: string;
  proximity: string;
  country: string;
  city: string;
  category: string;
  subCategory: string;
  minRating: number;
  status: string[];
  price: string;
  priceMin: number | undefined;
  priceMax: number | undefined;
  availability: string[];
};

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose?: () => void;
  mobile?: boolean;
}

const OFFER_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'business', label: 'Business' },
  { value: 'product', label: 'Produits' },
  { value: 'service', label: 'Services' },
  { value: 'menu', label: 'Menus' },
  { value: 'event', label: 'Événements' },
  { value: 'rental', label: 'Locations' },
  { value: 'developer', label: 'Développeurs' },
  { value: 'module', label: 'Modules' },
];

const PROXIMITY_OPTIONS = [
  { value: '', label: 'Partout' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
];

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'TG', label: 'Togo' },
  { value: 'BJ', label: 'Bénin' },
  { value: 'GH', label: 'Ghana' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'SN', label: 'Sénégal' },
  { value: 'NG', label: 'Nigeria' },
];

const CATEGORIES = [
  { value: '', label: 'Toutes catégories' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'BOUTIQUE_VETEMENTS', label: 'Mode & Vêtements' },
  { value: 'SALON_COIFFURE', label: 'Coiffure' },
  { value: 'SALON_BEAUTE', label: 'Beauté' },
  { value: 'PHARMACIE', label: 'Pharmacie' },
  { value: 'CENTRE_FORMATION', label: 'Formation' },
  { value: 'AGENCE_DIGITALE', label: 'Agence digitale' },
  { value: 'ARTISAN', label: 'Artisanat' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'AUTRE', label: 'Autre' },
];

const RATINGS = [
  { value: 0, label: 'Toutes les notes' },
  { value: 5, label: '5 étoiles' },
  { value: 4, label: '4 étoiles et plus' },
  { value: 3, label: '3 étoiles et plus' },
];

const STATUS_OPTIONS = [
  { value: 'verified', label: 'Vérifié' },
  { value: 'premium', label: 'Premium' },
  { value: 'recommended', label: 'Recommandé' },
];

const PRICE_OPTIONS = [
  { value: '', label: 'Tous les prix' },
  { value: 'free', label: 'Gratuit' },
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
  { value: 'custom', label: 'Personnalisé' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'now', label: 'Disponible maintenant' },
  { value: 'open', label: 'Ouvert actuellement' },
  { value: 'booking', label: 'Réservation disponible' },
  { value: 'delivery', label: 'Livraison disponible' },
];

type SectionKey = 'type' | 'proximity' | 'country' | 'city' | 'category' | 'rating' | 'status' | 'price' | 'availability';

export default function FilterSidebar({ filters, onChange, onClose, mobile }: FilterSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    type: false, proximity: false, country: false, city: false,
    category: false, rating: false, status: false, price: false, availability: false,
  });
  const [citySearch, setCitySearch] = useState('');

  const toggle = (key: SectionKey) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const toggleStatus = (value: string) => {
    const next = filters.status.includes(value)
      ? filters.status.filter((s) => s !== value)
      : [...filters.status, value];
    update({ status: next });
  };

  const toggleAvailability = (value: string) => {
    const next = filters.availability.includes(value)
      ? filters.availability.filter((a) => a !== value)
      : [...filters.availability, value];
    update({ availability: next });
  };

  const clearAll = () => onChange({
    type: '', proximity: '', country: '', city: '', category: '', subCategory: '',
    minRating: 0, status: [], price: '', priceMin: undefined, priceMax: undefined, availability: [],
  });

  const sections: { key: SectionKey; label: string; content: React.ReactNode }[] = [
    {
      key: 'type', label: "Type d'offre",
      content: (
        <div className="space-y-1">
          {OFFER_TYPES.map((opt) => (
            <button key={opt.value} onClick={() => update({ type: opt.value })}
              className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                filters.type === opt.value ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              {opt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'proximity', label: 'Proximité',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {PROXIMITY_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => update({ proximity: opt.value })}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                filters.proximity === opt.value ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand/30 hover:text-brand')}>
              {opt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'country', label: 'Pays',
      content: (
        <div className="space-y-1">
          {COUNTRIES.map((opt) => (
            <button key={opt.value} onClick={() => update({ country: opt.value })}
              className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                filters.country === opt.value ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              {opt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'city', label: 'Ville',
      content: (
        <div className="space-y-1">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Rechercher une ville..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
            {filters.city && (
              <button onClick={() => { update({ city: '' }); setCitySearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>
          <button onClick={() => { update({ city: '' }); setCitySearch(''); }}
            className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
              !filters.city ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
            Toutes les villes
          </button>
          {citySearch ? (
            <button onClick={() => { update({ city: citySearch }); }}
              className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                filters.city === citySearch ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              📍 {citySearch}
            </button>
          ) : (
            ['Lomé', 'Cotonou', 'Accra', 'Abidjan', 'Ouagadougou', 'Dakar', 'Lagos'].map((city) => (
              <button key={city} onClick={() => update({ city })}
                className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                  filters.city === city ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                {city}
              </button>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'category', label: 'Catégorie',
      content: (
        <div className="space-y-1">
          {CATEGORIES.map((opt) => (
            <button key={opt.value} onClick={() => update({ category: opt.value, subCategory: '' })}
              className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                filters.category === opt.value ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
              {opt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'rating', label: 'Note moyenne',
      content: (
        <div className="space-y-2">
          <div className="space-y-1">
            {RATINGS.map((opt) => (
              <button key={opt.value} onClick={() => update({ minRating: opt.value })}
                className={cn('block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                  filters.minRating === opt.value ? 'bg-brand text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Note minimum</span>
              <span className="text-xs font-semibold text-brand">{filters.minRating > 0 ? `${filters.minRating}+` : 'Tous'}</span>
            </div>
            <input type="range" min={0} max={5} step={0.5} value={filters.minRating}
              onChange={(e) => update({ minRating: Number(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-brand bg-gray-200 dark:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-sm" />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status', label: 'Statut',
      content: (
        <div className="space-y-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer px-1">
              <input type="checkbox" checked={filters.status.includes(opt.value)} onChange={() => toggleStatus(opt.value)}
                className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20 dark:bg-gray-800" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      key: 'price', label: 'Prix',
      content: (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {PRICE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => update({ price: opt.value })}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                  filters.price === opt.value ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand/30 hover:text-brand')}>
                {opt.label}
              </button>
            ))}
          </div>
          {filters.price === 'custom' && (
            <div className="flex items-center gap-2 pt-1">
              <input type="number" placeholder="Min" value={filters.priceMin ?? ''}
                onChange={(e) => update({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-gray-900 dark:text-gray-100 placeholder-gray-400" />
              <span className="text-xs text-gray-400">—</span>
              <input type="number" placeholder="Max" value={filters.priceMax ?? ''}
                onChange={(e) => update({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-gray-900 dark:text-gray-100 placeholder-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'availability', label: 'Disponibilité',
      content: (
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer px-1">
              <input type="checkbox" checked={filters.availability.includes(opt.value)} onChange={() => toggleAvailability(opt.value)}
                className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20 dark:bg-gray-800" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      ),
    },
  ];

  const content = (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Filtres</span>
        <button onClick={clearAll} className="text-xs text-brand hover:text-brand-700 dark:hover:text-brand-400 font-medium">
          Tout effacer
        </button>
        {mobile && onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {sections.map(({ key, label, content: sectionContent }) => (
        <div key={key} className="border-b border-gray-50 dark:border-gray-800/50">
          <button onClick={() => toggle(key)}
            className="flex items-center justify-between w-full px-1 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand-400 transition-colors">
            {label}
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 dark:text-gray-500 transition-transform', collapsed[key] && 'rotate-180')} />
          </button>
          {!collapsed[key] && <div className="pb-3 px-1">{sectionContent}</div>}
        </div>
      ))}
    </div>
  );

  if (mobile) return content;

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        {content}
      </div>
    </aside>
  );
}
