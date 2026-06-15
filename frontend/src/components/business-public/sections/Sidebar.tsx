'use client';

import Image from 'next/image';
import { Business } from '@/types/business';
import { MapPin, Phone, Mail, Globe, Clock, CreditCard, Truck, Share2, Heart, MessageCircle, QrCode } from 'lucide-react';
import { getDayLabel, formatPrice } from '@/utils/helpers';

interface SidebarProps {
  business: Business;
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
    if (!todayHours || todayHours.isClosed) return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    if (!todayHours.open || !todayHours.close) return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    const now = new Date();
    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    if (nowMin >= openMin && nowMin <= closeMin) {
      if (closeMin - nowMin <= 60) return { label: 'Ferme bientôt', className: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' };
      return { label: 'Ouvert', className: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
    }
    if (nowMin < openMin && openMin - nowMin <= 60) return { label: 'Ouvre bientôt', className: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    return { label: 'Fermé', className: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
  };

  const status = getStatus();

  return (
    <div className="space-y-6">
      {/* Statut */}
      {hasHours && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {status.label}
          </div>
        </div>
      )}

      {/* Coordonnées */}
      {hasInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
          <div className="space-y-3">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{business.address}</p>
                  {business.city && <p className="text-xs text-gray-400">{business.city}{business.country ? `, ${business.country}` : ''}</p>}
                </div>
              </div>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /> {business.phone}
              </a>
            )}
            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
                <MessageCircle className="w-4 h-4 flex-shrink-0" /> {business.whatsapp}
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /> {business.email}
              </a>
            )}
            {business.website && (
              <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-brand transition-colors">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" /> Site web
              </a>
            )}
          </div>
        </div>
      )}

      {/* Carte GPS */}
      {business.latitude && business.longitude && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" /> Localisation
          </h3>
          <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <iframe
              title="GPS"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude - 0.01},${business.latitude - 0.01},${business.longitude + 0.01},${business.latitude + 0.01}&layer=mapnik&marker=${business.latitude},${business.longitude}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Horaires */}
      {hasHours && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" /> Horaires
          </h3>
          <div className="space-y-2">
            {business.hours.map((h) => (
              <div key={h.day} className={`flex justify-between text-sm ${h.day === today ? 'font-medium text-brand' : 'text-gray-600 dark:text-gray-300'}`}>
                <span>{getDayLabel(h.day)}</span>
                <span>{h.isClosed ? 'Fermé' : `${h.open} - ${h.close}`}</span>
              </div>
            ))}
          </div>
          {todayHours && !todayHours.isClosed && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-400">
              Ouvert aujourd&apos;hui de {todayHours.open} à {todayHours.close}
            </p>
          )}
          {todayHours?.isClosed && (
            <p className="mt-3 text-xs text-red-500">Fermé aujourd&apos;hui</p>
          )}
        </div>
      )}

      {/* QR Code Business */}
      {typeof window !== 'undefined' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-brand" /> QR Code
          </h3>
          <div className="flex justify-center">
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}`}
              alt="QR Code"
              width={120}
              height={120}
              className="rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Moyens de paiement */}
      {hasPayments && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand" /> Paiements acceptés
          </h3>
          <div className="space-y-2">
            {business.paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand text-xs font-bold">
                  {pm.method === 'MOBILE_MONEY' ? 'M' : pm.method === 'BANK_TRANSFER' ? 'B' : pm.method === 'CREDIT_CARD' ? 'C' : '€'}
                </div>
                <div>
                  <p>{pm.name || pm.method}</p>
                  {pm.number && <p className="text-xs text-gray-400">{pm.number}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zones de livraison */}
      {hasZones && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand" /> Zones de livraison
          </h3>
          <div className="space-y-2">
            {business.deliveryZones.map((zone) => (
              <div key={zone.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">{zone.name}</span>
                <div className="text-right">
                  <span className="text-gray-600 dark:text-gray-300">{formatPrice(Number(zone.fee))}</span>
                  {zone.minOrder && <span className="text-xs text-gray-400 ml-1">(min. {formatPrice(Number(zone.minOrder))})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.href); }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Partager
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
        >
          <Heart className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </div>
  );
}
