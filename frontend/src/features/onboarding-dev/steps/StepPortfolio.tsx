'use client';

import { useRef, useState } from 'react';
import { Plus, X, Upload, ExternalLink, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { DevOnboardingData } from '@/types/developer';
import { uploadFile } from '../upload';

interface Props {
  data: DevOnboardingData;
  update: (partial: Partial<DevOnboardingData>) => void;
  disabled: boolean;
}

export default function StepPortfolio({ data, update, disabled }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = data.portfolioItems;

  const handleImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const addItem = () => {
    if (!title.trim() || items.length >= 10) return;
    update({
      portfolioItems: [
        ...items,
        {
          title: title.trim(),
          description: desc.trim() || undefined,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl.trim() || undefined,
        },
      ],
    });
    setTitle('');
    setDesc('');
    setLinkUrl('');
    setImageUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeItem = (i: number) => update({ portfolioItems: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
          <FolderOpen className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Vos projets réalisés
          </h3>
          <p className="text-xs text-gray-500">
            Montrez vos meilleures réalisations (0 à 10) — la preuve n°1 de votre savoir-faire (+15%
            de confiance)
          </p>
        </div>
      </div>

      {/* Galerie existante */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              {item.imageUrl ? (
                <div className="aspect-[4/3] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center bg-gradient-to-br from-brand/10 to-emerald-500/10 text-brand p-3 text-center">
                  <ImageIcon className="h-6 w-6 mb-1.5 opacity-60" />
                  <span className="text-xs font-semibold line-clamp-2">{item.title}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-6">
                <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-white/80 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" /> Voir le projet
                  </a>
                )}
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(i)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {items.length < 10 && (
        <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Input
            label="Titre du projet *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Application de livraison pour restaurant"
            maxLength={120}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Contexte, votre rôle, résultats obtenus…"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all resize-none"
            />
          </div>
          <Input
            label="Lien du projet"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            icon={<ExternalLink className="h-4 w-4" />}
            placeholder="https://…"
          />

          {/* Capture d'écran */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Capture d&apos;écran
            </span>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative w-20 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 p-0.5 rounded bg-white/90 text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium',
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                    (disabled || uploading) && 'opacity-60'
                  )}
                >
                  {uploading ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Uploader une image
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImage(f);
                e.target.value = '';
              }}
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={disabled || !title.trim()}
            onClick={addItem}
          >
            <Plus className="h-4 w-4" />
            Ajouter le projet
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center">
          Vous pouvez passer cette étape, mais un portfolio rempli augmente fortement vos chances
          d&apos;être contacté.
        </p>
      )}
    </div>
  );
}
