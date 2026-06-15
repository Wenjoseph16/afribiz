'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Image from 'next/image';
import { Star } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapBusiness {
  id: string;
  name: string;
  slug?: string;
  latitude: number;
  longitude: number;
  logo?: string;
  rating?: number;
  type?: string;
  city?: string;
}

export interface MarketMapProps {
  businesses: MapBusiness[];
  onBusinessClick?: (slug: string) => void;
  center?: [number, number];
  zoom?: number;
}

const lightTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const lightAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const darkAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

function MapBoundsUpdater({ businesses, center }: { businesses: MapBusiness[]; center?: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length === 0) {
      if (center) {
        map.setView(center, 12);
      }
      return;
    }
    if (businesses.length === 1) {
      map.setView([businesses[0].latitude, businesses[0].longitude], 12);
    } else {
      const bounds = L.latLngBounds(businesses.map((b) => [b.latitude, b.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [businesses, map, center]);

  return null;
}

const typeBadgeColors: Record<string, string> = {
  business: 'bg-brand/10 text-brand',
  product: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  service: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  event: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  rental: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  module: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default function MarketMap({ businesses, onBusinessClick, center, zoom = 12 }: MarketMapProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const defaultCenter: [number, number] = center || (businesses.length > 0
    ? [businesses[0].latitude, businesses[0].longitude]
    : [6.1319, 1.2226]);

  const centerExpr: LatLngExpression = defaultCenter;

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      <MapContainer
        center={centerExpr}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          url={isDark ? darkTile : lightTile}
          attribution={isDark ? darkAttribution : lightAttribution}
        />
        <MapBoundsUpdater businesses={businesses} center={center} />
        {businesses.map((biz) => (
          <Marker key={biz.id} position={[biz.latitude, biz.longitude]}>
            <Popup>
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2 mb-1.5">
                  {biz.logo && (
                    <Image src={biz.logo ?? ''} alt="" width={28} height={28} className="rounded-full object-cover" unoptimized />
                  )}
                  <span className="font-semibold text-sm text-gray-900">{biz.name}</span>
                </div>
                {biz.rating !== undefined && biz.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {biz.rating.toFixed(1)}
                  </div>
                )}
                {biz.city && (
                  <p className="text-xs text-gray-500 mb-1.5">{biz.city}</p>
                )}
                {biz.type && (
                  <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadgeColors[biz.type] || 'bg-gray-100 text-gray-600'}`}>
                    {biz.type}
                  </span>
                )}
                {biz.slug && (
                  <div className="mt-2">
                    <a
                      href={`/business/${biz.slug}`}
                      className="text-xs font-medium text-brand hover:text-brand-700"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onBusinessClick) {
                          onBusinessClick(biz.slug!);
                        } else {
                          window.location.href = `/business/${biz.slug}`;
                        }
                      }}
                    >
                      Voir →
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
