'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import type { OnboardingData, OnboardingOpeningHours } from '@/types/business';
import { useAuthStore } from '@/stores/authStore';

const AFRICAN_COUNTRIES = [
  'Togo', 'Bénin', 'Côte d\'Ivoire', 'Ghana', 'Nigeria', 'Sénégal',
  'Cameroun', 'Mali', 'Burkina Faso', 'Niger', 'Guinée', 'Congo',
  'République démocratique du Congo', 'Gabon', 'Tchad', 'Centrafrique',
  'Autre',
];

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const DAY_LABELS: Record<string, string> = {
  lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
  vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim',
};

function getDefaultHours(): OnboardingOpeningHours {
  const hours: OnboardingOpeningHours = {};
  DAYS.forEach((day) => {
    hours[day] = { open: '08:00', close: '18:00', closed: day === 'dimanche' };
  });
  return hours;
}

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export default function StepLocation({ data, onChange }: Props) {
  const { user } = useAuthStore();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [whatsappSame, setWhatsappSame] = useState(true);

  // Pré-remplir le téléphone depuis le compte
  useEffect(() => {
    if (!data.phone && user?.phone) {
      onChange({ phone: user.phone });
    }
  }, []); // eslint-disable-line

  // Init horaires si vide
  useEffect(() => {
    if (!data.openingHours || Object.keys(data.openingHours).length === 0) {
      onChange({ openingHours: getDefaultHours() });
    }
  }, []); // eslint-disable-line

  const toggleDay = (day: string) => {
    const hours = { ...data.openingHours };
    if (!hours[day]) {
      hours[day] = { open: '08:00', close: '18:00', closed: false };
    } else {
      hours[day] = { ...hours[day], closed: !hours[day].closed };
    }
    onChange({ openingHours: hours });
  };

  const updateHour = (day: string, field: 'open' | 'close', value: string) => {
    const hours = { ...data.openingHours };
    if (hours[day]) {
      hours[day] = { ...hours[day], [field]: value };
      onChange({ openingHours: hours });
    }
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsLoading(false);
        setGpsError('');
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === 1) {
          setGpsError('Permission refusée. Autorisez la géolocalisation dans les paramètres du navigateur.');
        } else if (error.code === 2) {
          setGpsError('Position indisponible. Essayez de entrer les coordonnées manuellement.');
        } else {
          setGpsError('Délai dépassé. Vérifiez votre connexion et réessayez.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleWhatsappToggle = (same: boolean) => {
    setWhatsappSame(same);
    if (same) {
      onChange({ whatsapp: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pays + Région + Ville */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Pays *</label>
          <select
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none"
          >
            {AFRICAN_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Région</label>
          <input
            type="text"
            value={data.region}
            onChange={(e) => onChange({ region: e.target.value })}
            placeholder="Région / État"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Ville *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Ex: Lomé, Abidjan"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Quartier + Adresse */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Quartier</label>
          <input
            type="text"
            value={data.quarter}
            onChange={(e) => onChange({ quarter: e.target.value })}
            placeholder="Ex: Agbalepedogan"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Adresse détaillée</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Ex: Rue 123, à côté de la station Total"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* GPS */}
      <div>
        <button
          onClick={detectGPS}
          disabled={gpsLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
        >
          <MapPin className="h-4 w-4" />
          {gpsLoading ? 'Détection en cours…' : data.latitude ? `GPS activé (${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)})` : 'Utiliser ma position GPS'}
        </button>
        {gpsError && (
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">{gpsError}</p>
        )}
        {data.latitude && data.longitude && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            ✓ Position enregistrée : {data.latitude?.toFixed(6)}, {data.longitude?.toFixed(6)}
          </p>
        )}
      </div>

      {/* Téléphone + WhatsApp */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
            <Phone className="inline h-3.5 w-3.5 mr-1" />
            Téléphone *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+228 90 12 34 56"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">WhatsApp</label>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => handleWhatsappToggle(true)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${whatsappSame ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}
            >
              C&apos;est le même
            </button>
            <button
              onClick={() => handleWhatsappToggle(false)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${!whatsappSame ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}
            >
              Numéro séparé
            </button>
          </div>
          {!whatsappSame && (
            <input
              type="tel"
              value={data.whatsapp || ''}
              onChange={(e) => onChange({ whatsapp: e.target.value })}
              placeholder="+228 91 23 45 67"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          )}
        </div>
      </div>

      {/* Horaires */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          <Clock className="h-4 w-4" />
          Horaires d&apos;ouverture
        </label>
        <div className="space-y-1.5">
          {DAYS.map((day) => {
            const h = data.openingHours?.[day] || { open: '08:00', close: '18:00', closed: false };
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-12 text-xs font-semibold rounded-lg py-1.5 text-center transition-all ${
                    h.closed
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-400 line-through'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
                {h.closed ? (
                  <span className="text-xs text-gray-400">Fermé</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHour(day, 'open', e.target.value)}
                      className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <span className="text-gray-400 text-xs">à</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHour(day, 'close', e.target.value)}
                      className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
