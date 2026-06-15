'use client';

import { useState } from 'react';
import { BUSINESS_CATEGORIES, BUSINESS_TYPE_LABELS, BUSINESS_TYPE_ICONS, TOGO_CITIES } from '@/constants/business';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export function StepIdentity({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      {/* Logo & Cover Image */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Image de marque</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Logo</label>
            <div className="relative w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand/50 transition-colors flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden group cursor-pointer">
              {data.logo ? (
                <>
                  <Image src={data.logo ?? ''} alt="Logo" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  <button type="button" onClick={() => onChange({ logo: '' })}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <label className="flex flex-col items-center gap-1 cursor-pointer p-4">
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  <span className="text-[10px] text-gray-400 text-center">Ajouter un logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => onChange({ logo: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Bannière / Image de couverture</label>
            <div className="relative w-full h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand/50 transition-colors flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden group cursor-pointer">
              {data.coverImage ? (
                <>
                  <Image src={data.coverImage ?? ''} alt="Bannière" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  <button type="button" onClick={() => onChange({ coverImage: '' })}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <label className="flex flex-col items-center gap-1 cursor-pointer p-4">
                  <ImagePlus className="h-6 w-6 text-gray-400" />
                  <span className="text-[10px] text-gray-400 text-center">Ajouter une bannière</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => onChange({ coverImage: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nom du business *"
            placeholder="Ex: Chez Alice Resto"
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Catégorie *</label>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {BUSINESS_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">
                  {cat.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {cat.types.map(type => {
                    const Icon = BUSINESS_TYPE_ICONS[type];
                    const selected = data.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onChange({ type: type as any })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selected
                            ? 'bg-brand text-white shadow-sm'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span>{BUSINESS_TYPE_LABELS[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Brève description *
          <span className="text-gray-400 font-normal ml-1">
            ({150 - (data.shortDescription?.length || 0)} caractères restants)
          </span>
        </label>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          rows={3}
          maxLength={150}
          placeholder="Décrivez votre activité en quelques mots..."
          value={data.shortDescription}
          onChange={e => onChange({ shortDescription: e.target.value })}
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Téléphone *"
          placeholder="+228 XX XX XX XX"
          value={data.phone}
          onChange={e => onChange({ phone: e.target.value })}
        />
        <Input
          label="WhatsApp"
          placeholder="+228 XX XX XX XX"
          value={data.whatsapp || ''}
          onChange={e => onChange({ whatsapp: e.target.value || undefined })}
        />
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Pays"
          value="Togo"
          disabled
        />
        <div>
          <label className="block text-sm font-medium mb-2">Ville *</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            value={data.city}
            onChange={e => onChange({ city: e.target.value })}
          >
            <option value="">Sélectionnez une ville</option>
            {TOGO_CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <Input
          label="Adresse *"
          placeholder="Rue, quartier..."
          value={data.address}
          onChange={e => onChange({ address: e.target.value })}
        />
      </div>

      {/* GPS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localisation GPS (optionnel)</label>
          <button
            type="button"
            onClick={() => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                  () => {} // Silently fail — user can enter manually
                );
              }
            }}
            className="text-xs font-medium text-brand hover:text-brand-700 transition-colors"
          >
            Détecter ma position
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="6.1319"
            value={data.latitude?.toString() || ''}
            onChange={e => onChange({ latitude: parseFloat(e.target.value) || undefined })}
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="1.2228"
            value={data.longitude?.toString() || ''}
            onChange={e => onChange({ longitude: parseFloat(e.target.value) || undefined })}
          />
        </div>
      </div>

      {/* Professional Info */}
      <Card className="space-y-4 !p-5 !bg-gray-50 dark:!bg-gray-800 !border-dashed dark:!border-gray-600">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Informations professionnelles (optionnel)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom du gérant"
            placeholder="Nom du responsable"
            value={data.managerName || ''}
            onChange={e => onChange({ managerName: e.target.value || undefined })}
          />
          <Input
            label="Années d'expérience"
            type="number"
            min={0}
            placeholder="5"
            value={data.experience?.toString() || ''}
            onChange={e => onChange({ experience: parseInt(e.target.value) || undefined })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Bio du gérant</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={2}
            placeholder="Parlez-nous du gérant..."
            value={data.managerBio || ''}
            onChange={e => onChange({ managerBio: e.target.value || undefined })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Compétences (séparées par des virgules)"
            placeholder="Gestion, Marketing,..."
            value={(data.skills || []).join(', ')}
            onChange={e => onChange({ skills: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] })}
          />
          <Input
            label="Certifications"
            placeholder="Certificat 1, Certificat 2,..."
            value={(data.certifications || []).join(', ')}
            onChange={e => onChange({ certifications: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] })}
          />
        </div>
      </Card>

      {/* Online Presence */}
      <Card className="space-y-4 !p-5 !bg-gray-50 dark:!bg-gray-800 !border-dashed dark:!border-gray-600">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Présence en ligne (optionnel)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Site web" placeholder="https://..." value={data.website || ''} onChange={e => onChange({ website: e.target.value || undefined })} />
          <Input label="Facebook" placeholder="URL Facebook" value={data.facebook || ''} onChange={e => onChange({ facebook: e.target.value || undefined })} />
          <Input label="Instagram" placeholder="URL Instagram" value={data.instagram || ''} onChange={e => onChange({ instagram: e.target.value || undefined })} />
          <Input label="TikTok" placeholder="URL TikTok" value={data.tiktok || ''} onChange={e => onChange({ tiktok: e.target.value || undefined })} />
          <Input label="LinkedIn" placeholder="URL LinkedIn" value={data.linkedin || ''} onChange={e => onChange({ linkedin: e.target.value || undefined })} />
        </div>
      </Card>
    </div>
  );
}
