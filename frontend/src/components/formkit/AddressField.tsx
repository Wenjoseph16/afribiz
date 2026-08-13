'use client';

import { useState } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface AddressFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onCoordinates?: (lat: number, lng: number) => void;
  error?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  detectLabel?: string;
  disabled?: boolean;
}

/**
 * FormKit — AddressField
 * Adresse + bouton GPS (géolocalisation du téléphone).
 * Réalité africaine : pas de GPS précis partout → le quartier reste saisissable à la main,
 * et la position est un bonus (livraison précise, zone auto-détectée).
 */
export function AddressField({
  label = 'Adresse',
  value,
  onChange,
  onCoordinates,
  error,
  help,
  placeholder = 'Quartier, Rue, Repère...',
  required,
  detectLabel,
  disabled,
}: AddressFieldProps) {
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [localError, setLocalError] = useState('');

  const detect = () => {
    if (!('geolocation' in navigator)) {
      setLocalError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setLocalError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordinates?.(pos.coords.latitude, pos.coords.longitude);
        setLocated(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocalError('Position introuvable. Saisissez votre quartier manuellement.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <Input
        label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setLocalError('');
        }}
        placeholder={placeholder}
        icon={<MapPin className="w-4 h-4" />}
        error={error || localError}
        helperText={help}
        required={required}
        disabled={disabled}
        rightIcon={
          <button
            type="button"
            onClick={detect}
            disabled={disabled || locating}
            aria-label="Utiliser ma position"
            className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-700 disabled:opacity-50"
          >
            {locating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : located ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
            {detectLabel ?? (locating ? 'Localisation…' : 'GPS')}
          </button>
        }
      />
    </div>
  );
}
