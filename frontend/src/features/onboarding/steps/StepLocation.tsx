'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { LocationSelect } from '@/components/auth/LocationSelect';
import { GpsMapPicker, type GpsPosition } from '@/components/onboarding/GpsMapPicker';
import { Globe } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  TiktokIcon,
} from '@/components/onboarding/SocialIcons';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export function StepLocation({ data, onChange }: Props) {
  const [detecting, setDetecting] = useState(false);

  const handleGps = (pos: GpsPosition) => {
    onChange({
      latitude: pos.latitude,
      longitude: pos.longitude,
      address: pos.address || data.address,
    });
  };

  return (
    <div className="space-y-7">
      {/* Adresse lisible */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Adresse * <span className="text-gray-400 font-normal">(quartier, rue, bâtiment)</span>
        </label>
        <input
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Ex : Quartier Doulassamé, Rue 12, Lomé"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Pays / Région / Ville */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <LocationSelect
          country={data.country}
          region={data.region || ''}
          city={data.city}
          neighborhood={data.neighborhood || ''}
          onCountryChange={(v) => {
            const prefix = '+228';
            onChange({
              country: v,
              region: '',
              city: '',
              phone: data.phone ? data.phone.replace(/^\+\d{1,4}/, prefix) : prefix,
              whatsapp: data.whatsapp ? data.whatsapp.replace(/^\+\d{1,4}/, prefix) : prefix,
            });
          }}
          onRegionChange={(v) => onChange({ region: v, city: '' })}
          onCityChange={(v) => onChange({ city: v })}
          onNeighborhoodChange={(v) => onChange({ neighborhood: v })}
          onCountryCodeChange={(code) => {
            const prefix = `+${code}`;
            onChange({
              phone: data.phone ? data.phone.replace(/^\+\d{1,4}/, prefix) : prefix,
              whatsapp: data.whatsapp ? data.whatsapp.replace(/^\+\d{1,4}/, prefix) : prefix,
            });
          }}
          showFields="all"
        />
      </div>

      {/* GPS réel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Positionner sur la carte <span className="text-gray-400 font-normal">(recommandé)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (!('geolocation' in navigator)) return;
              setDetecting(true);
              navigator.geolocation.getCurrentPosition(
                (p) => {
                  handleGps({ latitude: p.coords.latitude, longitude: p.coords.longitude });
                  setDetecting(false);
                },
                () => setDetecting(false)
              );
            }}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Détecter ma position
          </button>
        </div>
        <GpsMapPicker
          latitude={data.latitude}
          longitude={data.longitude}
          onSelect={handleGps}
          detecting={detecting}
        />
      </div>

      {/* Téléphone & WhatsApp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Téléphone *"
          placeholder="+228 XX XX XX XX"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
        <Input
          label="WhatsApp"
          placeholder="+228 XX XX XX XX"
          value={data.whatsapp || ''}
          onChange={(e) => onChange({ whatsapp: e.target.value || undefined })}
        />
      </div>

      {/* Réseaux sociaux */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Réseaux sociaux & site web
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              field: 'website' as const,
              label: 'Site web',
              icon: Globe,
              placeholder: 'https://...',
            },
            {
              field: 'facebook' as const,
              label: 'Facebook',
              icon: FacebookIcon,
              placeholder: 'URL Facebook',
            },
            {
              field: 'instagram' as const,
              label: 'Instagram',
              icon: InstagramIcon,
              placeholder: 'URL Instagram',
            },
            {
              field: 'tiktok' as const,
              label: 'TikTok',
              icon: TiktokIcon,
              placeholder: 'URL TikTok',
            },
            {
              field: 'linkedin' as const,
              label: 'LinkedIn',
              icon: LinkedinIcon,
              placeholder: 'URL LinkedIn',
            },
            {
              field: 'youtube' as const,
              label: 'YouTube',
              icon: YoutubeIcon,
              placeholder: 'URL YouTube',
            },
          ].map(({ field, label, icon: Icon, placeholder }) => (
            <div key={field} className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={(data[field] as string) || ''}
                onChange={(e) => onChange({ [field]: e.target.value || undefined })}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <span className="sr-only">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}