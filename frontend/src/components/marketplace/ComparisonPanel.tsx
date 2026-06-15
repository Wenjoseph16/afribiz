'use client';

import { useState } from 'react';
import { X, Star, MapPin, Shield, Zap, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface ComparisonItem {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  category?: string;
  city?: string;
  country?: string;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isPremium?: boolean;
  isTopSeller?: boolean;
  description?: string;
  modules?: string[];
  logo?: string;
  image?: string;
  distance?: string;
}

interface ComparisonPanelProps {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

function RatingCell({ item }: { item: ComparisonItem }) {
  return (
    <div className="flex items-center gap-1 justify-center">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold">{item.rating?.toFixed(1) || '\u2014'}</span>
      <span className="text-xs text-gray-400">({item.reviewCount || 0})</span>
    </div>
  );
}

function LocationCell({ item }: { item: ComparisonItem }) {
  return (
    <div className="flex items-center gap-1 justify-center">
      <MapPin className="h-3.5 w-3.5 text-gray-400" />
      <span>{item.city || '\u2014'}{item.country ? `, ${item.country}` : ''}</span>
    </div>
  );
}

function CategoryCell({ item }: { item: ComparisonItem }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
      {item.category || item.type || '\u2014'}
    </span>
  );
}

function BadgesCell({ item }: { item: ComparisonItem }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {item.isVerified && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-semibold">
          <Shield className="h-2.5 w-2.5" /> V&#233;rifi&#233;
        </span>
      )}
      {item.isPremium && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] font-semibold">
          <Star className="h-2.5 w-2.5" /> Premium
        </span>
      )}
      {item.isTopSeller && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-[10px] font-semibold">
          <Zap className="h-2.5 w-2.5" /> Top
        </span>
      )}
      {!item.isVerified && !item.isPremium && !item.isTopSeller && (
        <span className="text-xs text-gray-400">{'\u2014'}</span>
      )}
    </div>
  );
}

function DistanceCell({ item }: { item: ComparisonItem }) {
  return <span className="text-center block">{item.distance || '\u2014'}</span>;
}

function ModulesCell({ item }: { item: ComparisonItem }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {(item.modules || []).slice(0, 3).map((m) => (
        <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          {m}
        </span>
      ))}
      {(!item.modules || item.modules.length === 0) && <span className="text-xs text-gray-400">{'\u2014'}</span>}
    </div>
  );
}

function DescriptionCell({ item }: { item: ComparisonItem }) {
  return <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 text-center">{item.description || '\u2014'}</p>;
}

interface FieldDef {
  key: string;
  label: string;
  Component: React.ComponentType<{ item: ComparisonItem }>;
}

const COMPARISON_FIELDS: FieldDef[] = [
  { key: 'rating', label: 'Note', Component: RatingCell },
  { key: 'city', label: 'Localisation', Component: LocationCell },
  { key: 'category', label: 'Cat\u00e9gorie', Component: CategoryCell },
  { key: 'badges', label: 'Badges', Component: BadgesCell },
  { key: 'distance', label: 'Distance', Component: DistanceCell },
  { key: 'modules', label: 'Modules', Component: ModulesCell },
  { key: 'description', label: 'Description', Component: DescriptionCell },
];

export default function ComparisonPanel({ items, onRemove, onClear }: ComparisonPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0) return null;

  const bestRating = Math.max(...items.map((i) => i.rating || 0));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Comparaison ({items.length}/4)
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </button>
        </div>
        <button
          onClick={onClear}
          className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          Tout effacer
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Crit&#232;re
                </th>
                {items.map((item) => (
                  <th key={item.id} className="px-4 py-3 text-center min-w-[160px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-lg font-bold text-brand overflow-hidden">
                          {item.logo || item.image ? (
                            <Image src={(item.logo || item.image) ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                          ) : (
                            item.name[0]
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                          {item.name}
                        </p>
                        <Link
                          href={`/business/${item.slug || item.id}`}
                          className="text-[10px] text-brand hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
                        >
                          Voir &#8594;
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
                {items.length < 4 && (
                  <th className="px-4 py-3 text-center min-w-[160px]">
                    <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto">
                      <Plus className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Ajouter un business</p>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FIELDS.map((field, idx) => (
                <tr
                  key={field.key}
                  className={cn(
                    'border-b border-gray-50 dark:border-gray-800/50',
                    idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'
                  )}
                >
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {field.label}
                  </td>
                  {items.map((item) => {
                    const isBest = field.key === 'rating' && item.rating === bestRating && bestRating > 0;
                    return (
                      <td key={item.id} className="px-4 py-3">
                        <div className={cn(isBest && 'text-emerald-600 dark:text-emerald-400')}>
                          <field.Component item={item} />
                        </div>
                      </td>
                    );
                  })}
                  {items.length < 4 && <td className="px-4 py-3" />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
