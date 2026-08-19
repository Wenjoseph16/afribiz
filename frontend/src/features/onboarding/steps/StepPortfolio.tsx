'use client';

import { useState, useRef } from 'react';
import { Plus, X, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { OnboardingData, OnboardingPortfolioItem } from '@/types/business';
import { apiClient } from '@/services/apiClient';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepPortfolio({ data, onChange }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.uploadMedia(formData);
      if (res.data?.success) {
        setImageUrl(res.data.data.url || res.data.data.path);
      }
    } catch { /* skip */ }
  };

  const addItem = () => {
    if (!title.trim()) return;
    const item: OnboardingPortfolioItem = {
      title: title.trim(),
      description: desc.trim(),
      imageUrl,
      linkUrl: linkUrl.trim(),
    };
    onChange({ portfolio: [...data.portfolio, item] });
    setTitle('');
    setDesc('');
    setLinkUrl('');
    setImageUrl('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeItem = (index: number) => {
    onChange({ portfolio: data.portfolio.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Montrez vos meilleures réalisations. Vous pouvez en ajouter 0 à 10, ou passer cette étape.
        </p>
      </div>

      {/* Galerie existante */}
      {data.portfolio.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {data.portfolio.map((item, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
              {item.imageUrl ? (
                <div className="aspect-[4/3] relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-300 dark:text-white/10" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-white/70 truncate">{item.description}</p>
                )}
              </div>
              <button
                onClick={() => removeItem(i)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-emerald-500 transition-all"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire ajout */}
      {data.portfolio.length < 10 && (
        <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-white/10 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du projet *"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Lien (optionnel)"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description courte (100 caractères max)"
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              <Upload className="h-3 w-3" />
              {imageUrl ? 'Photo ajoutée ✓' : 'Ajouter une photo'}
            </button>
            <button
              onClick={addItem}
              disabled={!title.trim()}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* Skip */}
      <button
        onClick={() => onChange({ portfolio: data.portfolio })}
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        Je le ferai plus tard →
      </button>
    </div>
  );
}
