'use client';

import { BUSINESS_TYPE_LABELS } from '@/constants/business';
import type { OnboardingData } from '@/types/business';
import {
  MapPin,
  Phone,
  Clock,
  Award,
  Image as ImageIcon,
  Sparkles,
  Images,
  Briefcase,
  Lock,
} from 'lucide-react';

const DAYS_SHORT: Record<string, string> = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim',
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mon-business'
  );
}

/** En-tête de section miniature, miroir du SectionHeader de la vitrine. */
function MiniSectionHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Images;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-50 dark:bg-emerald-900/40">
          <Icon className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
        </span>
        <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          {label}
        </span>
      </div>
      {typeof count === 'number' && count > 0 && (
        <span className="text-[10px] text-gray-400">{count}</span>
      )}
    </div>
  );
}

interface Props {
  data: OnboardingData;
}

export function OnboardingLivePreview({ data }: Props) {
  const hasContent = Boolean(data.name || data.typeId || data.description);
  const slug = slugify(data.name || '');

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-900/5 bg-white dark:bg-gray-900">
      {/* Chrome navigateur */}
      <div className="flex items-center gap-2 px-3 h-9 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-white/10">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="flex-1 flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-white/10 text-[10px] text-gray-500 dark:text-gray-400 truncate">
          <Lock className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
          afribiz.app/business/{slug}
        </span>
      </div>

      {/* Bannière */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-400 to-emerald-700">
        {data.banner ? (
          <img src={data.banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-1.5 text-[11px] text-white/80 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <ImageIcon className="h-3 w-3" />
              Votre bannière
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
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

      {/* En-tête */}
      <div className="px-4 pt-8 pb-3">
        {data.typeId && (
          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-semibold uppercase tracking-wider">
            {BUSINESS_TYPE_LABELS[data.typeId] || data.typeId}
          </span>
        )}
        <h3 className="mt-1 font-bold tracking-tight text-gray-900 dark:text-white text-base leading-snug">
          {data.name || 'Nom du business'}
        </h3>
        {data.description && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}

        {/* Compétences */}
        {data.competencies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {data.competencies.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
            {data.competencies.length > 6 && (
              <span className="px-2 py-0.5 text-[10px] text-gray-400">
                +{data.competencies.length - 6}
              </span>
            )}
          </div>
        )}

        {(data.experienceYears || data.certificates.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {data.experienceYears && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                <Sparkles className="h-3 w-3 text-emerald-500" />
                {data.experienceYears === '<1' ? '< 1 an' : `${data.experienceYears} ans`}{' '}
                d&apos;expérience
              </span>
            )}
            {data.certificates.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                <Award className="h-3 w-3 text-emerald-500" />
                {data.certificates.length} certificat{data.certificates.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Corps de page : sections miroir */}
      <div className="px-4 pb-4 space-y-3 bg-gray-50/60 dark:bg-white/[0.02] pt-3 border-t border-gray-100 dark:border-white/5">
        {/* Portfolio */}
        <section>
          <MiniSectionHeader icon={Images} label="Réalisations" count={data.portfolio.length} />
          {data.portfolio.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {data.portfolio.slice(0, 4).map((item, i) => (
                <div
                  key={i}
                  className="p-[1px] rounded-lg bg-gradient-to-br from-gray-200 via-white to-gray-200 dark:from-white/10 dark:via-transparent dark:to-white/10"
                >
                  <div className="relative rounded-[calc(0.5rem-1px)] overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-white/5">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-[9px] font-medium text-white truncate">{item.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-lg border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center"
                >
                  <Images className="h-3.5 w-3.5 text-gray-300 dark:text-white/10" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Localisation & horaires */}
        <section className="p-[1px] rounded-xl bg-gradient-to-br from-gray-200 via-white to-gray-200 dark:from-white/10 dark:via-transparent dark:to-white/10">
          <div className="rounded-[calc(0.75rem-1px)] bg-white dark:bg-gray-900 p-3 space-y-2.5">
            <MiniSectionHeader icon={MapPin} label="Localisation" />
            {data.city || data.address ? (
              <div className="space-y-1">
                <p className="text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />
                  <span>
                    {data.quarter && `${data.quarter}, `}
                    <span className="font-medium">{data.city}</span>
                    {data.country && `, ${data.country}`}
                  </span>
                </p>
                {data.address && (
                  <p className="text-[11px] text-gray-400 ml-[18px]">{data.address}</p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-gray-300 dark:text-white/20 italic">
                Ville et adresse à venir…
              </p>
            )}

            {data.openingHours && Object.keys(data.openingHours).length > 0 && (
              <>
                <div className="h-px bg-gray-100 dark:bg-white/5" />
                <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                  <Clock className="h-2.5 w-2.5" />
                  Horaires
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {Object.entries(data.openingHours).map(([day, h]) => (
                    <div key={day} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 dark:text-gray-400">
                        {DAYS_SHORT[day] || day}
                      </span>
                      {h.closed ? (
                        <span className="text-gray-300 dark:text-white/20">Fermé</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 tabular-nums">
                          {h.open}–{h.close}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Contact */}
        {data.phone && (
          <section className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              <Phone className="h-3 w-3" />
              {data.phone}
            </span>
            {data.whatsapp && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-[10px] font-semibold text-green-700 dark:text-green-400">
                WhatsApp
              </span>
            )}
          </section>
        )}

        {/* Modules */}
        {data.modules.length > 0 && (
          <section>
            <MiniSectionHeader icon={Briefcase} label="Services" count={data.modules.length} />
            <div className="flex flex-wrap gap-1">
              {data.modules.slice(0, 8).map((mod) => (
                <span
                  key={mod}
                  className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium"
                >
                  {MODULE_LABELS[mod] || mod}
                </span>
              ))}
              {data.modules.length > 8 && (
                <span className="px-2 py-0.5 text-[10px] text-gray-400">
                  +{data.modules.length - 8}
                </span>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer vitrine */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest uppercase text-gray-300 dark:text-white/20">
          AfriBiz
        </span>
        <span className="text-[9px] text-gray-300 dark:text-white/20">Page publique</span>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="absolute inset-0 top-9 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[1px] flex items-center justify-center p-8 pointer-events-none">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[220px]">
            Remplissez le formulaire pour voir votre page publique se construire ici en temps réel.
          </p>
        </div>
      )}
    </div>
  );
}

const MODULE_LABELS: Record<string, string> = {
  PRODUCTS: 'Produits',
  SERVICES: 'Services',
  MENU: 'Menu',
  ROOMS: 'Chambres',
  BOOKINGS: 'Réservations',
  ORDERS: 'Commandes',
  QUOTES_INVOICES: 'Devis & Factures',
  DEBTS_PAYMENTS: 'Dettes & Paiements',
  PROMOTIONS: 'Promotions',
  PLANNING: 'Planning',
  EMPLOYEES: 'Employés',
  PORTFOLIO: 'Portfolio',
  SUBSCRIPTIONS: 'Abonnements',
  DELIVERIES: 'Livraisons',
  EVENTS: 'Événements',
  RENTALS: 'Locations',
  DOCUMENTS: 'Documents',
  PARTNERS: 'Partenaires',
  DISPUTES: 'Litiges',
  MODULE_MARKETPLACE: 'Marketplace',
  ADVANCED_TASKS: 'Tâches avancées',
  TRAINING: 'Formations',
};
