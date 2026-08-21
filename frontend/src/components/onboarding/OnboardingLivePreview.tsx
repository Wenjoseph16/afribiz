'use client';

import { BUSINESS_TYPE_LABELS } from '@/constants/business';
import type { OnboardingData } from '@/types/business';
import {
  MapPin,
  Phone,
  Clock,
  Award,
  ExternalLink,
  Package,
  CreditCard,
  Truck,
  CalendarCheck,
  Star,
} from 'lucide-react';

const MODULE_ICONS: Record<string, { icon: any; label: string }> = {
  PRODUCTS: { icon: Package, label: 'Catalogue' },
  PAYMENT: { icon: CreditCard, label: 'Paiement' },
  DELIVERIES: { icon: Truck, label: 'Livraison' },
  BOOKINGS: { icon: CalendarCheck, label: 'Réservations' },
  RENTALS: { icon: CalendarCheck, label: 'Locations' },
  AFFILIATE: { icon: Star, label: 'Affiliation' },
  MARKETING: { icon: Star, label: 'Marketing' },
  LOYALTY: { icon: Star, label: 'Fidélité' },
  CRM: { icon: Star, label: 'CRM' },
};

const DAYS_SHORT: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
};

interface Props {
  data: OnboardingData;
}

export function OnboardingLivePreview({ data }: Props) {
  const hasContent = data.name || data.typeId || data.description;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm overflow-hidden text-sm">
      {/* Bannière */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-400 to-emerald-700">
        {data.banner && <img src={data.banner} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Logo */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-md flex items-center justify-center overflow-hidden">
            {data.logo ? (
              <img src={data.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-emerald-600">{data.name?.[0] || '?'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Header info */}
      <div className="px-4 pt-8 pb-3">
        <h3 className="font-bold text-gray-900 dark:text-white text-base">
          {data.name || 'Nom du business'}
        </h3>
        {data.typeId && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-medium">
            {BUSINESS_TYPE_LABELS[data.typeId] || data.typeId}
          </span>
        )}
        {data.description && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      {/* Compétences */}
      {data.competencies.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Compétences
          </p>
          <div className="flex flex-wrap gap-1">
            {data.competencies.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-full text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expérience */}
      {data.experienceYears && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-gray-400">
            {data.experienceYears === '<1' ? '< 1 an' : `${data.experienceYears} ans`}{' '}
            d&apos;expérience
          </p>
        </div>
      )}

      {/* Certificats */}
      {data.certificates.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Certificats
          </p>
          {data.certificates.map((cert, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
            >
              <Award className="h-3 w-3 text-emerald-500" />
              {cert.name}
              {cert.issuer && <span className="text-gray-400">— {cert.issuer}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Portfolio */}
      {data.portfolio.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Réalisations
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {data.portfolio.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="relative rounded-lg overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-white/5"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] font-medium text-white truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Localisation */}
      {(data.city || data.address) && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-white/5 pt-3">
          <div className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
            <span>
              {data.quarter && `${data.quarter}, `}
              {data.city}
              {data.country && `, ${data.country}`}
            </span>
          </div>
          {data.address && (
            <div className="flex items-start gap-1.5 text-[11px] text-gray-400 mt-1 ml-4.5">
              <span>{data.address}</span>
            </div>
          )}
        </div>
      )}

      {/* Contact */}
      {data.phone && (
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Phone className="h-3 w-3 text-emerald-500" />
            {data.phone}
          </div>
          {data.whatsapp && (
            <div className="flex items-center gap-1 text-[11px] text-green-600">
              <span>💬 WhatsApp</span>
            </div>
          )}
        </div>
      )}

      {/* Horaires */}
      {data.openingHours && Object.keys(data.openingHours).length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Clock className="h-3 w-3" />
            Horaires
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {Object.entries(data.openingHours).map(([day, h]) => (
              <div key={day} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">{DAYS_SHORT[day] || day}</span>
                {h.closed ? (
                  <span className="text-gray-400">Fermé</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    {h.open} – {h.close}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      {data.modules.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-white/5 pt-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Services
          </p>
          <div className="flex flex-wrap gap-1">
            {data.modules.map((mod) => {
              const def = MODULE_ICONS[mod];
              return (
                <span
                  key={mod}
                  className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-medium"
                >
                  {def?.label || mod}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-gray-400">
            Remplissez le formulaire pour voir votre page publique se construire ici
          </p>
        </div>
      )}
    </div>
  );
}
