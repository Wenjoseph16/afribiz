'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface GpsPosition {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Props {
  latitude?: number;
  longitude?: number;
  onSelect: (pos: GpsPosition) => void;
  detecting?: boolean;
}

const DEFAULT_CENTER: [number, number] = [6.1319, 1.2228];

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`
    );
    const data = await res.json();
    if (typeof data?.display_name === 'string' && data.display_name.length > 0) {
      return data.display_name;
    }
  } catch {
    // réseau indisponible : l'adresse sera saisie manuellement
  }
  return undefined;
}

/**
 * Carte impérative (L.map) au lieu de <MapContainer> : react-leaflet v4 n'est pas
 * compatible React 18 StrictMode (double-mount → « Map container is already
 * initialized » qui fait planter toute l'étape 3). On détruit proprement la carte
 * au cleanup et on purge le _leaflet_id résiduel du container avant chaque init.
 */
export function GpsMapPicker({ latitude, longitude, onSelect, detecting }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const initial = useRef<[number, number]>([
    latitude ?? DEFAULT_CENTER[0],
    longitude ?? DEFAULT_CENTER[1],
  ]);

  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // StrictMode remonte le composant 2x en dev : le premier map a été détruit par
    // le cleanup mais Leaflet laisse un _leaflet_id résiduel → on le purge pour
    // autoriser une ré-initialisation propre.
    const raw = el as HTMLElement & { _leaflet_id?: number };
    if (raw._leaflet_id) {
      delete raw._leaflet_id;
    }

    const map = L.map(el, { scrollWheelZoom: true });
    map.setView(initial.current, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      handleSelect(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (lat: number, lng: number) => {
    const map = mapRef.current;
    if (map) map.setView([lat, lng], 15, { animate: true });
    setResolving(true);
    const address = await reverseGeocode(lat, lng);
    setResolving(false);
    onSelectRef.current({ latitude: lat, longitude: lng, address });
  };

  const detectPosition = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => handleSelect(p.coords.latitude, p.coords.longitude),
      () => {}
    );
  };

  // Marker + recentrage quand la position (clic / géoloc) change.
  const hasPosition = typeof latitude === 'number' && typeof longitude === 'number';
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasPosition) return;
    const pos: [number, number] = [latitude!, longitude!];
    if (!markerRef.current) {
      markerRef.current = L.marker(pos).addTo(map);
    } else {
      markerRef.current.setLatLng(pos);
    }
    // Ne pas recentrer sur la position initiale par défaut (déjà la vue initiale).
    if (pos[0] !== initial.current[0] || pos[1] !== initial.current[1]) {
      map.setView(pos, 15, { animate: true });
    }
  }, [latitude, longitude, hasPosition]);

  return (
    <div className="space-y-2">
      <div className="h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative">
        <div ref={containerRef} className="h-full w-full" />
        {detecting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[500]">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={detectPosition}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Détecter ma position
        </button>
        {resolving ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Recherche de l'adresse...
          </span>
        ) : (
          <span className={cn('text-xs', hasPosition ? 'text-emerald-600' : 'text-gray-400')}>
            {hasPosition
              ? `${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}`
              : 'Cliquez sur la carte pour placer votre business'}
          </span>
        )}
      </div>
    </div>
  );
}
