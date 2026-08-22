'use client';

import Image from 'next/image';
import { BookOpen, Clock, ChevronRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLayawayOffers, LayawayButton, LayawayBadge } from '../useLayaway';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface TrainingItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  duration?: string | null;
  lessons?: number;
  certificate?: boolean;
  image?: string | null;
}

interface TrainingsProps {
  trainings: TrainingItem[];
  businessSlug?: string;
}

export function Trainings({ trainings, businessSlug }: TrainingsProps) {
  const stagger = useStaggerReveal(trainings?.length || 0);
  if (!trainings?.length) return null;

  // Badge 🔒 Épargne — offres actives sur les formations (1 seul appel)
  const trainingIds = trainings.map((t) => t.id);
  const { data: layawayMap } = useLayawayOffers('TRAINING', trainingIds);

  return (
    <section id="section-trainings" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader
          eyebrow="Apprentissage"
          title="Formations"
          description="Développez vos compétences avec nos formations"
        />

        <div ref={stagger.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {trainings.map((training, idx) => (
            <div
              key={training.id}
              className={cn('group relative', revealClasses(stagger.visible, idx))}
              style={revealDelay(idx)}
            >
              <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 h-full biz-card">
                <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  {training.image && (
                    <div className="aspect-video overflow-hidden relative bg-gray-50">
                      <Image
                        src={training.image}
                        alt={training.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <LayawayBadge active={!!(layawayMap || {})[training.id]} />
                      </div>
                    </div>
                  )}

                  <div className="p-4 md:p-5 flex flex-col flex-1">
                    {!training.image && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <LayawayBadge active={!!(layawayMap || {})[training.id]} />
                      </div>
                    )}
                    {training.category && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-600 mb-2">
                        {training.category}
                      </p>
                    )}

                    <h3 className="font-semibold text-gray-900 text-[15px] leading-tight line-clamp-2 mb-1">
                      {training.title}
                    </h3>

                    {training.description && (
                      <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed mb-3">
                        {training.description}
                      </p>
                    )}

                    {/* Chips meta */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-auto mb-3">
                      {training.duration && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-medium text-gray-500">
                          <Clock className="w-3 h-3" />
                          {training.duration}
                        </span>
                      )}
                      {training.lessons && training.lessons > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-medium text-gray-500">
                          <BookOpen className="w-3 h-3" />
                          {training.lessons} leçon{training.lessons > 1 ? 's' : ''}
                        </span>
                      )}
                      {training.certificate && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-600">
                          <Award className="w-3 h-3" />
                          Certificat
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <Link
                        href={
                          businessSlug ? `/business/${businessSlug}/trainings/${training.id}` : '#'
                        }
                        className="flex-1"
                      >
                        <Button variant="outline" className="w-full rounded-full group/btn">
                          Voir la formation
                          <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                      <LayawayButton offer={(layawayMap || {})[training.id]} itemId={training.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
