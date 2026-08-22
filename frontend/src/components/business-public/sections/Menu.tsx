'use client';

import Image from 'next/image';
import { MenuCategory, MenuItem } from '@/types/business';
import {
  Utensils,
  Star,
  Flame,
  BadgePercent,
  Clock,
  ShoppingBag,
  ChefHat,
} from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface MenuProps {
  categories: MenuCategory[];
  uncategorized: MenuItem[];
  whatsapp?: string;
}

export function Menu({ categories, uncategorized, whatsapp }: MenuProps) {
  const hasContent = categories?.length || uncategorized?.length;
  const stagger = useStaggerReveal(categories?.length || 1);
  if (!hasContent) return null;

  return (
    <section
      id="section-menu"
      className="scroll-mt-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Restaurant" title="Notre Carte" />

        <div ref={stagger.ref} className="max-w-3xl mx-auto">
          {categories?.map((category, catIdx) => (
            <div
              key={category.id}
              className={cn('mb-12', revealClasses(stagger.visible, catIdx))}
              style={revealDelay(catIdx)}
            >
              {/* ─── Category header ─── */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100">
                  <ChefHat className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {category.name}
                    <span className="ml-2 text-xs font-medium text-gray-400 align-middle">
                      {category.items?.length || 0}
                    </span>
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {category.items?.map((item) => (
                  <MenuItemCard key={item.id} item={item} whatsapp={whatsapp} />
                ))}
              </div>
            </div>
          ))}
          {uncategorized?.length > 0 && (
            <div className="space-y-3">
              {uncategorized.map((item) => (
                <MenuItemCard key={item.id} item={item} whatsapp={whatsapp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuItemCard({ item, whatsapp }: { item: MenuItem; whatsapp?: string }) {
  const itemPrice =
    item.isPromotional && item.promotionalPrice ? item.promotionalPrice : item.price;

  return (
    <div className="group relative flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl biz-card border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-lg hover:shadow-brand-900/5 transition-all duration-300">
      {/* Badges */}
      <div className="absolute -top-1.5 -left-1.5 flex gap-1 z-10">
        {item.isStar && (
          <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md flex items-center gap-0.5 shadow-sm shadow-amber-500/30">
            <Star className="w-2.5 h-2.5 fill-white" />
            Star
          </span>
        )}
        {item.isPopular && (
          <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-md flex items-center gap-0.5 shadow-sm">
            <Flame className="w-2.5 h-2.5" />
            Populaire
          </span>
        )}
        {item.isPromotional && item.discountPercent && (
          <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md flex items-center gap-0.5 shadow-sm">
            <BadgePercent className="w-2.5 h-2.5" />-{item.discountPercent}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-3.5 flex-1 min-w-0 pt-1">
        {item.images?.[0] ? (
          <Image
            src={item.images[0]}
            alt={item.name}
            width={80}
            height={80}
            className="rounded-xl object-cover flex-shrink-0 shadow-sm group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
            <Utensils className="w-6 h-6 text-gray-300 dark:text-gray-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                {item.name}
              </h4>
              {(item.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.tags?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {item.status === 'OUT_OF_STOCK' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                Rupture
              </span>
            )}
          </div>

          {(item.shortDescription || item.description) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {item.shortDescription || item.description}
            </p>
          )}

          {/* Info row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-400">
            {item.prepTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.prepTime} min
              </span>
            )}
            {item.rating && item.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {item.rating.toFixed(1)}
              </span>
            )}
            {item.variants && item.variants.length > 0 && (
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" />
                {item.variants.length} variantes
              </span>
            )}
            {item.ingredients && item.ingredients.length > 0 && (
              <span className="truncate max-w-[200px]">{item.ingredients.join(', ')}</span>
            )}
          </div>

          {/* Variants quick view */}
          {item.hasVariants && item.variants && item.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {item.variants.slice(0, 3).map((v) => (
                <span
                  key={v.id}
                  className="text-[10px] bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600"
                >
                  {v.name}:{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatPrice(Number(v.price))}
                  </span>
                </span>
              ))}
              {item.variants.length > 3 && (
                <span className="text-[10px] text-brand-600 font-medium">
                  +{item.variants.length - 3} autres
                </span>
              )}
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <p className="text-[10px] text-orange-500 mt-1">
              Allergènes: {item.allergens.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Price & Order */}
      <div className="flex flex-col items-end gap-2 shrink-0 ml-4 pt-1">
        <div className="text-right">
          {item.isPromotional && item.promotionalPrice && (
            <span className="text-xs text-gray-400 line-through block">
              {formatPrice(Number(item.price))}
            </span>
          )}
          <span className="font-bold text-brand-600 text-base tracking-tight">
            {formatPrice(Number(itemPrice))}
          </span>
        </div>
        {whatsapp && item.isAvailable && (
          <a
            href={`https://wa.me/${whatsapp}?text=Bonjour%2C%20je%20souhaite%20commander%20${encodeURIComponent(item.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-semibold transition-colors whitespace-nowrap active:scale-[0.97]"
          >
            Commander
          </a>
        )}
      </div>
    </div>
  );
}
