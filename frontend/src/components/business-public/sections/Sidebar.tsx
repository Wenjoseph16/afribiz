'use client';

import { QRCodeCanvas as QRCode } from 'qrcode.react';
import Image from 'next/image';
import { Business } from '@/types/business';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CreditCard,
  Truck,
  Share2,
  Heart,
  MessageCircle,
  QrCode,
  Navigation,
} from 'lucide-react';
import { getDayLabel, formatPrice } from '@/utils/helpers';

interface SidebarProps {
  business: Business;
}

function SidebarCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-1.5 rounded-2xl ring-1 ring-gray-200/50 dark:ring-white/5 ${className}`}>
      <div className="p-5 rounded-xl bg-white dark:bg-gray-800/80">{children}</div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
      <span className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
        {icon}
      </span>
      {children}
    </h3>
  );
}

export function Sidebar({ business }: SidebarProps) {
  const hasHours = business.hours?.length > 0;
  const hasPayments = business.paymentMethods?.length > 0;
  const hasZones = business.deliveryZones?.length > 0;
  const hasInfo = business.address || business.phone || business.email || business.website;

  if (!hasHours && !hasPayments && !hasZones && !hasInfo) return null;

  const today = new Date().getDay();
  const todayHours = business.hours?.find((h) => h.day === today);

  const getStatus = () => {
    if (!todayHours || todayHours.isClosed)
      return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (!todayHours.open || !todayHours.close)
      return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    const now = new Date();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (nowMin >= openMin && nowMin <= closeMin) {
      if (closeMin - nowMin <= 60)
        return {
          label: 'Ferme bientôt',
          className: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        };
      return {
        label: 'Ouvert',
        className: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
      };
    }
    if (nowMin < openMin && openMin - nowMin <= 60)
      return {
        label: 'Ouvre bientôt',
        className: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
      };
    return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
  };

  const status = getStatus();

  return (
    <div className="space-y-4">
      {/* Statut */}
      {hasHours && (
        <SidebarCard>
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {status.label}
            </div>
            {todayHours && !todayHours.isClosed && todayHours.open && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {todayHours.open} — {todayHours.close}
              </span>
            )}
          </div>
        </SidebarCard>
      )}

      {/* Coordonnées */}
      {hasInfo && (
        <SidebarCard>
          <SectionTitle icon={<MapPin className="w-4 h-4" />}>Informations</SectionTitle>
          <div className="space-y-3">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{business.address}</p>
                  {business.city && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {business.city}
                      {business.country ? `, ${business.country}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-400 shrink-0" /> {business.phone}
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-400 shrink-0" /> {business.email}
              </a>
            )}
            {business.website && (
              <a
                href={
                  business.website.startsWith('http')
                    ? business.website
                    : `https://${business.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
              >
                <Globe className="w-4 h-4 text-gray-400 shrink-0" /> Site web
              </a>
            )}
          </div>
        </SidebarCard>
      )}

      {/* Carte GPS */}
      {business.latitude && business.longitude && (
        <SidebarCard>
          <SectionTitle icon={<Navigation className="w-4 h-4" />}>Localisation</SectionTitle>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-video rounded-xl overflow-hidden group relative ring-1 ring-gray-200 dark:ring-gray-700"
          >
            <iframe
              title="GPS"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude - 0.01},${business.latitude - 0.01},${business.longitude + 0.01},${business.latitude + 0.01}&layer=mapnik&marker=${business.latitude},${business.longitude}`}
              width="100%"
              height="100%"
              style={{ border: 0, pointerEvents: 'none' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-lg transition-opacity">
                Ouvrir dans Google Maps
              </span>
            </div>
          </a>
          <div className="flex gap-2 mt-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all duration-300 active:scale-[0.98]"
            >
              <Navigation className="w-3.5 h-3.5" /> Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${business.latitude},${business.longitude}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-300 active:scale-[0.98]"
            >
              <Navigation className="w-3.5 h-3.5" /> Waze
            </a>
          </div>
        </SidebarCard>
      )}

      {/* Horaires */}
      {hasHours && (
        <SidebarCard>
          <SectionTitle icon={<Clock className="w-4 h-4" />}>Horaires</SectionTitle>
          <div className="space-y-2">
            {business.hours.map((h) => (
              <div
                key={h.day}
                className={`flex justify-between text-sm py-1 ${h.day === today ? 'font-semibold text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <span>{getDayLabel(h.day)}</span>
                <span>{h.isClosed ? 'Fermé' : `${h.open} — ${h.close}`}</span>
              </div>
            ))}
          </div>
        </SidebarCard>
      )}

      {/* QR Code */}
      {typeof window !== 'undefined' && (
        <SidebarCard>
          <SectionTitle icon={<QrCode className="w-4 h-4" />}>QR Code</SectionTitle>
          <div className="flex justify-center">
            <QRCode
              value={window.location.href}
              size={120}
              level="M"
              includeMargin={true}
              className="rounded-xl"
            />
          </div>
        </SidebarCard>
      )}

      {/* Moyens de paiement */}
      {hasPayments && (
        <SidebarCard>
          <SectionTitle icon={<CreditCard className="w-4 h-4" />}>Paiements</SectionTitle>
          <div className="space-y-2">
            {business.paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold">
                  {pm.method === 'MOBILE_MONEY'
                    ? 'M'
                    : pm.method === 'BANK_TRANSFER'
                      ? 'B'
                      : pm.method === 'CREDIT_CARD'
                        ? 'C'
                        : '€'}
                </div>
                <div>
                  <p className="font-medium">{pm.name || pm.method}</p>
                  {pm.number && <p className="text-xs text-gray-400">{pm.number}</p>}
                </div>
              </div>
            ))}
          </div>
        </SidebarCard>
      )}

      {/* Zones de livraison */}
      {hasZones && (
        <SidebarCard>
          <SectionTitle icon={<Truck className="w-4 h-4" />}>Livraison</SectionTitle>
          <div className="space-y-2">
            {business.deliveryZones.map((zone) => (
              <div key={zone.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">{zone.name}</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(Number(zone.fee))}
                  </span>
                  {zone.minOrder && (
                    <span className="text-xs text-gray-400 ml-1">
                      (min. {formatPrice(Number(zone.minOrder))})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SidebarCard>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" /> Partager
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all duration-300 active:scale-[0.98]">
          <Heart className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </div>
  );
}
