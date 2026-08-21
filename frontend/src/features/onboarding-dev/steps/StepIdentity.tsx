'use client';

import { useRef, useState } from 'react';
import { User, Building2, Camera, Mail, Phone, MapPin, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { DevOnboardingData } from '@/types/developer';
import { uploadFile } from '../upload';

interface Props {
  data: DevOnboardingData;
  update: (partial: Partial<DevOnboardingData>) => void;
  disabled: boolean;
}

function AvatarUpload({
  url,
  icon: Icon,
  label,
  onUploaded,
  disabled,
}: {
  url: string;
  icon: typeof User;
  label: string;
  onUploaded: (url: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = async (file: File) => {
    setErr('');
    setUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (!uploaded) throw new Error("Échec de l'upload");
      onUploaded(uploaded);
    } catch (e: any) {
      setErr(e?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed group transition-all',
          url
            ? 'border-emerald-300 dark:border-emerald-700'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand/60 hover:bg-gray-50 dark:hover:bg-gray-800/50',
          (disabled || uploading) && 'opacity-60 cursor-not-allowed'
        )}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            {uploading ? (
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
              <>
                <Icon className="h-7 w-7 mb-1" />
                <span className="text-[10px] font-medium">Choisir</span>
              </>
            )}
          </span>
        )}
      </button>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
        {url && (
          <button
            type="button"
            onClick={() => onUploaded('')}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {err && <span className="text-[11px] text-red-500">{err}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function StepIdentity({ data, update, disabled }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
          <User className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Votre identité professionnelle
          </h3>
          <p className="text-xs text-gray-500">
            Une photo et un logo rassurent immédiatement les entreprises (+10% de confiance)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-8 py-2">
        <AvatarUpload
          url={data.photo}
          icon={User}
          label="Photo de profil"
          onUploaded={(u) => update({ photo: u })}
          disabled={disabled}
        />
        <AvatarUpload
          url={data.companyLogo}
          icon={Building2}
          label="Logo entreprise"
          onUploaded={(u) => update({ companyLogo: u })}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Nom d'affichage *"
          value={data.companyName}
          onChange={(e) => update({ companyName: e.target.value })}
          icon={<Building2 className="h-4 w-4" />}
          placeholder="Ex : DevStudio Lomé"
          maxLength={100}
        />
        <Input
          label="Email professionnel"
          value={data.professionalEmail}
          onChange={(e) => update({ professionalEmail: e.target.value })}
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="contact@monstudio.com"
        />
        <Input
          label="Téléphone"
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
          icon={<Phone className="h-4 w-4" />}
          placeholder="+228 90 00 00 00"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Pays"
            value={data.country}
            onChange={(e) => update({ country: e.target.value })}
            icon={<MapPin className="h-4 w-4" />}
            placeholder="Togo"
          />
          <Input
            label="Ville"
            value={data.city}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="Lomé"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Bio / Présentation{' '}
          <span className="text-xs text-gray-400 font-normal">
            (min. 50 caractères pour inspirer confiance)
          </span>
        </label>
        <textarea
          value={data.bio}
          onChange={(e) => update({ bio: e.target.value })}
          rows={3}
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
          placeholder="Ex : Développeur full-stack spécialisé en solutions de paiement mobile pour PME africaines…"
          maxLength={500}
        />
        <p
          className={cn(
            'text-xs mt-1 text-right',
            data.bio.length >= 50 ? 'text-emerald-500' : 'text-gray-400'
          )}
        >
          {data.bio.length}/500
        </p>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-300">
        <FileText className="h-4 w-4 shrink-0 mt-0.5" />
        Vos informations personnelles sont pré-remplies depuis votre compte AfriBiz — corrigez si
        besoin.
      </div>
    </div>
  );
}
