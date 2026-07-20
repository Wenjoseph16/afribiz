'use client';

import { useState } from 'react';
import {
  ShoppingBag,
  Percent,
  ExternalLink,
  BarChart3,
  HelpCircle,
  MapPin,
  Hash,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StorySticker } from '@afribiz/shared';

interface StickerPickerProps {
  onAddSticker: (sticker: StorySticker) => void;
  onRemoveSticker: (stickerId: string) => void;
  stickers: StorySticker[];
}

const STICKER_TYPES = [
  {
    type: 'PRODUCT' as const,
    label: 'Produit',
    icon: ShoppingBag,
    color: 'from-brand-500 to-brand-600',
  },
  {
    type: 'PROMO' as const,
    label: 'Promotion',
    icon: Percent,
    color: 'from-amber-500 to-orange-600',
  },
  { type: 'LINK' as const, label: 'Lien', icon: ExternalLink, color: 'from-blue-500 to-blue-600' },
  {
    type: 'POLL' as const,
    label: 'Sondage',
    icon: BarChart3,
    color: 'from-purple-500 to-purple-600',
  },
  {
    type: 'QUESTION' as const,
    label: 'Question',
    icon: HelpCircle,
    color: 'from-teal-500 to-teal-600',
  },
  {
    type: 'LOCATION' as const,
    label: 'Localisation',
    icon: MapPin,
    color: 'from-red-500 to-red-600',
  },
  { type: 'HASHTAG' as const, label: 'Hashtag', icon: Hash, color: 'from-pink-500 to-pink-600' },
];

const POSITIONS = [
  { x: 50, y: 15, label: 'Haut' },
  { x: 50, y: 50, label: 'Centre' },
  { x: 50, y: 85, label: 'Bas' },
  { x: 25, y: 50, label: 'Gauche' },
  { x: 75, y: 50, label: 'Droite' },
];

export function StickerPicker({ onAddSticker, onRemoveSticker, stickers }: StickerPickerProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [stickerForm, setStickerForm] = useState({ label: '', value: '' });
  const [selectedPos, setSelectedPos] = useState({ x: 50, y: 50 });

  const handleAdd = () => {
    if (!selectedType) return;
    const sticker: StorySticker = {
      id: crypto.randomUUID(),
      type: selectedType as StorySticker['type'],
      label: stickerForm.label,
      value: stickerForm.value,
      positionX: selectedPos.x,
      positionY: selectedPos.y,
      createdAt: new Date().toISOString(),
    };
    onAddSticker(sticker);
    setStickerForm({ label: '', value: '' });
    setSelectedType(null);
  };

  return (
    <div className="space-y-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-brand-500" />
          Autocollants interactifs
        </p>
        <span className="text-[10px] text-gray-400">{stickers.length} ajouté(s)</span>
      </div>

      {/* Sticker type grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {STICKER_TYPES.map((st) => {
          const Icon = st.icon;
          const isSelected = selectedType === st.type;
          return (
            <button
              key={st.type}
              onClick={() => setSelectedType(isSelected ? null : st.type)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all duration-200',
                isSelected
                  ? 'bg-gradient-to-br ' + st.color + ' text-white shadow-md scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:text-brand-600'
              )}
              title={st.label}
            >
              <Icon className="w-4 h-4" />
              <span className="leading-tight">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sticker form */}
      {selectedType && (
        <div className="space-y-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-fade-in">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {STICKER_TYPES.find((s) => s.type === selectedType)?.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Texte"
              value={stickerForm.label}
              onChange={(e) => setStickerForm((p) => ({ ...p, label: e.target.value }))}
              className="col-span-2 px-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <input
              type="text"
              placeholder={
                selectedType === 'PRODUCT'
                  ? 'ID produit'
                  : selectedType === 'PROMO'
                    ? '30'
                    : selectedType === 'LINK'
                      ? 'https://...'
                      : selectedType === 'LOCATION'
                        ? 'Ville, pays'
                        : 'Valeur'
              }
              value={stickerForm.value}
              onChange={(e) => setStickerForm((p) => ({ ...p, value: e.target.value }))}
              className="col-span-2 px-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Position presets */}
          <div>
            <p className="text-[10px] font-medium text-gray-500 mb-1.5">Position</p>
            <div className="flex gap-1.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.label}
                  onClick={() => setSelectedPos({ x: pos.x, y: pos.y })}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded-md font-medium transition-all',
                    selectedPos.x === pos.x && selectedPos.y === pos.y
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!stickerForm.label}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 transition-all"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setSelectedType(null);
                setStickerForm({ label: '', value: '' });
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Active stickers list */}
      {stickers.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {stickers.map((st) => {
            const StIcon = STICKER_TYPES.find((s) => s.type === st.type)?.icon || Plus;
            return (
              <div
                key={st.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
              >
                <StIcon className="w-3 h-3 text-brand-500 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{st.label}</span>
                <span className="text-[10px] text-gray-400 shrink-0">
                  ({st.positionX}%, {st.positionY}%)
                </span>
                <button
                  onClick={() => onRemoveSticker(st.id)}
                  className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
