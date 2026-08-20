'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { BUSINESS_CATEGORIES, BUSINESS_TYPE_LABELS } from '@/constants/business';
import type { OnboardingData } from '@/types/business';
import { apiClient } from '@/services/apiClient';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepIdentity({ data, onChange }: Props) {
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (file: File, field: 'logo' | 'banner') => {
    setUploadError('');
    const setUploading = field === 'logo' ? setUploadingLogo : setUploadingBanner;
    setUploading(true);
    try {
      const res = await apiClient.uploadMedia(file);
      if (res.data?.success) {
        onChange({ [field]: res.data.data.url || res.data.data.path });
      } else {
        setUploadError(`Échec de l'upload: ${res.data?.error || 'Erreur inconnue'}`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Erreur lors de l\'upload';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, field);
  };

  return (
    <div className="space-y-6">
      {/* Nom */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Nom du business *
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex: Ma Boutique, Restaurant Le Coin"
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Type de business *
        </label>
        <select
          value={data.typeId}
          onChange={(e) => onChange({ typeId: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm appearance-none"
        >
          <option value="">Sélectionnez un type…</option>
          {BUSINESS_CATEGORIES.map((cat) => (
            <optgroup key={cat.label} label={cat.label}>
              {cat.types.map((t) => (
                <option key={t} value={t}>{BUSINESS_TYPE_LABELS[t] || t}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Description *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Ex: Le meilleur poulet braisé de Cocody depuis 2015"
          maxLength={300}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{data.description.length}/300</p>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs">
          {uploadError}
        </div>
      )}

      {/* Logo + Bannière */}
      <div className="grid grid-cols-2 gap-4">
        {/* Logo */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
            Logo
          </label>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
          {data.logo ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
              <img src={data.logo} alt="Logo" className="w-full h-full object-cover" />
              <button
                onClick={() => onChange({ logo: null })}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-all disabled:opacity-50"
            >
              {uploadingLogo ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-xs font-medium">{uploadingLogo ? 'Upload…' : 'Logo'}</span>
            </button>
          )}
        </div>

        {/* Bannière */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
            Bannière
          </label>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
          {data.banner ? (
            <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
              <img src={data.banner} alt="Bannière" className="w-full h-full object-cover" />
              <button
                onClick={() => onChange({ banner: null })}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-all disabled:opacity-50"
            >
              {uploadingBanner ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span className="text-xs font-medium">{uploadingBanner ? 'Upload…' : 'Bannière'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
