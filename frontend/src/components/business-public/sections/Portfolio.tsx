'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PortfolioItem } from '@/types/business';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface PortfolioProps {
  items: PortfolioItem[];
}

export function Portfolio({ items }: PortfolioProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!items?.length) return null;

  const open = (idx: number) => setLightboxIdx(idx);
  const close = () => setLightboxIdx(null);
  const prev = () => lightboxIdx !== null && setLightboxIdx((lightboxIdx - 1 + items.length) % items.length);
  const next = () => lightboxIdx !== null && setLightboxIdx((lightboxIdx + 1) % items.length);

  return (
    <>
      <section id="section-portfolio" className="scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          {/* ─── Eyebrow + Title ─── */}
          <div className="mb-10 md:mb-14">
            <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-amber-50 text-amber-700 border border-amber-100 mb-4">
              Réalisations
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Portfolio
            </h2>
            <p className="mt-2 text-gray-500 text-sm">
              {items.length} réalisation{items.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* ─── Masonry-style Grid ─── */}
          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {items.map((item, idx) => {
              /* Alternate tall items for masonry feel */
              const isTall = idx % 5 === 0 || idx % 5 === 3;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'group relative cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                    isTall && 'row-span-2',
                    visible
                      ? 'opacity-100 translate-y-0 blur-0'
                      : 'opacity-0 translate-y-10 blur-[2px]'
                  )}
                  style={{ transitionDelay: `${Math.min(idx * 100, 500)}ms` }}
                  onClick={() => open(idx)}
                >
                  {/* ─── Double-Bezel ─── */}
                  <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-white to-gray-100 h-full">
                    <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full">
                      <div className={cn('relative overflow-hidden bg-gray-50', isTall ? 'aspect-[3/4]' : 'aspect-square')}>
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-200" />
                          </div>
                        )}

                        {/* Gradient reveal on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />

                        {/* Content on hover — slides up */}
                        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                          <h3 className="font-semibold text-white text-sm md:text-base leading-tight mb-1">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-[12px] text-white/70 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.category && (
                            <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-semibold text-white/60">
                              {item.category}
                            </span>
                          )}
                          {item.url && (
                              <a
                                href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/80 hover:text-white transition-colors w-fit"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Voir plus
                            </a>
                          )}
                        </div>

                        {/* Expand icon — top right */}
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
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

      {/* ─── Lightbox ─── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Image */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            {items[lightboxIdx].images?.[0] ? (
              <Image
                src={items[lightboxIdx].images[0]}
                alt={items[lightboxIdx].title}
                fill
                className="object-contain rounded-2xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <ImageIcon className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Caption */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <h3 className="text-white font-semibold text-lg">{items[lightboxIdx].title}</h3>
            {items[lightboxIdx].description && (
              <p className="text-white/60 text-sm mt-1">{items[lightboxIdx].description}</p>
            )}
            <p className="text-white/40 text-xs mt-2">{lightboxIdx + 1} / {items.length}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── cn helper (local) ─── */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
