'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Promotion } from '@/types/business';
import { Tag, Percent, Check, Copy, CalendarClock } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface PromotionsProps {
  promotions: Promotion[];
}

export function Promotions({ promotions }: PromotionsProps) {
  const stagger = useStaggerReveal(promotions?.length || 0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (!promotions?.length) return null;

  const now = new Date();

  const copyCode = async (promo: Promotion) => {
    if (!promo.code) return;
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  const daysLeft = (endsAt: string) =>
    Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 86_400_000);

  return (
    <section id="section-promotions" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Bonnes affaires" title="Promotions" count={promotions.length} />

        <div ref={stagger.ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {promotions.map((promo, idx) => {
            const isExpired = promo.endsAt && new Date(promo.endsAt) < now;
            const left = promo.endsAt && !isExpired ? daysLeft(promo.endsAt) : null;
            const isPercent = promo.discountType === 'PERCENTAGE';
            return (
              <div
                key={promo.id}
                className={cn('group relative', revealClasses(stagger.visible, idx))}
                style={revealDelay(idx)}
              >
                <div
                  className={cn(
                    'p-[1px] rounded-[1.25rem] h-full biz-card transition-opacity',
                    isExpired
                      ? 'bg-gray-100 opacity-60'
                      : 'bg-gradient-to-br from-brand-200 via-brand-50 to-brand-100'
                  )}
                >
                  <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
                    {/* Image / bandeau */}
                    {promo.image ? (
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <Image
                          src={promo.image}
                          alt={promo.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                        {/* Médaillon remise */}
                        <span
                          className={cn(
                            'absolute top-3 right-3 w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg shadow-red-900/20',
                            isPercent ? 'bg-red-500' : 'bg-emerald-500'
                          )}
                        >
                          <span className="text-sm font-extrabold leading-none tracking-tight">
                            {isPercent ? `-${promo.discountValue}%` : '-'}
                          </span>
                          {!isPercent && (
                            <span className="text-[9px] font-bold mt-0.5">
                              {formatPrice(Number(promo.discountValue))}
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'h-2 w-full',
                          isPercent
                            ? 'bg-gradient-to-r from-red-400 via-red-500 to-orange-400'
                            : 'bg-gradient-to-r from-emerald-400 via-brand-500 to-emerald-300'
                        )}
                      />
                    )}

                    {/* Contenu */}
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-[15px] leading-tight line-clamp-1">
                          {promo.title}
                        </h3>
                        {!promo.image && (
                          <span
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shrink-0',
                              isPercent
                                ? 'bg-red-50 text-red-600'
                                : 'bg-emerald-50 text-emerald-600'
                            )}
                          >
                            {isPercent ? (
                              <Percent className="w-3 h-3" />
                            ) : (
                              <Tag className="w-3 h-3" />
                            )}
                            {isPercent
                              ? `${promo.discountValue}%`
                              : formatPrice(Number(promo.discountValue))}
                          </span>
                        )}
                      </div>
                      {promo.description && (
                        <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                          {promo.description}
                        </p>
                      )}

                      {/* Code promo copiable */}
                      {promo.code && (
                        <button
                          onClick={() => copyCode(promo)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2.5 mb-3 hover:bg-brand-50 transition-colors active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Tag className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <code className="text-sm font-mono font-bold text-brand-700 truncate">
                              {promo.code}
                            </code>
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 shrink-0">
                            {copiedId === promo.id ? (
                              <>
                                <Check className="w-3 h-3" /> Copié
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copier
                              </>
                            )}
                          </span>
                        </button>
                      )}

                      {/* Dates */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-auto">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {promo.startsAt &&
                            `Du ${new Date(promo.startsAt).toLocaleDateString('fr-FR')}`}
                          {promo.endsAt && ` au ${new Date(promo.endsAt).toLocaleDateString('fr-FR')}`}
                        </span>
                        {left !== null && (
                          <span
                            className={cn(
                              'font-semibold',
                              left <= 3 ? 'text-red-500' : 'text-emerald-600'
                            )}
                          >
                            {left <= 0 ? "Dernier jour !" : `${left} j restants`}
                          </span>
                        )}
                        {isExpired && (
                          <span className="font-semibold text-gray-400">Expirée</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
