'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Plus, Trash2, ExternalLink, Images } from 'lucide-react';
import { DragDropUpload } from '@/components/onboarding/DragDropUpload';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

interface PortfolioEntry {
  imageUrl: string;
  title: string;
  description: string;
  linkUrl: string;
}

function parsePortfolio(data: OnboardingData): PortfolioEntry[] {
  const images = data.portfolioImages || [];
  return images.map((url, i) => ({
    imageUrl: url,
    title: (data as any)[`portfolioTitle_${i}`] || '',
    description: (data as any)[`portfolioDesc_${i}`] || '',
    linkUrl: (data as any)[`portfolioLink_${i}`] || '',
  }));
}

export function StepPortfolio({ data, onChange }: Props) {
  const images = data.portfolioImages || [];

  const addImage = (newUrls: string | string[]) => {
    const urls = Array.isArray(newUrls) ? newUrls : [newUrls];
    const current = data.portfolioImages || [];
    onChange({ portfolioImages: [...current, ...urls].slice(0, 10) });
  };

  const removeImage = (idx: number) => {
    const current = data.portfolioImages || [];
    onChange({ portfolioImages: current.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Images className="h-5 w-5 text-emerald-500" />
          Vos réalisations
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
          Montrez vos meilleurs travaux. Les clients font plus confiance aux business avec un portfolio.
        </p>
      </div>

      {/* Upload zone */}
      <DragDropUpload
        value={data.portfolioImages || []}
        onChange={(v) => {
          if (Array.isArray(v)) {
            onChange({ portfolioImages: v });
          } else if (v) {
            addImage(v);
          }
        }}
        multiple
        max={10}
        hint="Jusqu'à 10 photos. Formats : JPG, PNG, WebP."
        uploadingLabel="Chargement..."
      />

      {/* Gallery grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wider">
            {images.length} photo{images.length > 1 ? 's' : ''} ajoutée{images.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {images.map((url, i) => (
                <motion.div
                  key={url + i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Réalisation ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-medium text-white bg-black/60 rounded px-2 py-0.5 truncate">
                      Réalisation #{i + 1}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
          <Images className="h-10 w-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-white/40 mb-1">
            Pas encore de photos
          </p>
          <p className="text-xs text-gray-400 dark:text-white/20">
            Ajoutez des images de vos réalisations pour inspirer confiance à vos clients.
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-4">
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          <strong>Astuce :</strong> Les business avec 5+ photos de portfolio reçoivent en moyenne 3x plus de demandes.
          Ajoutez vos meilleures réalisations pour maximiser votre impact.
        </p>
      </div>
    </div>
  );
}
