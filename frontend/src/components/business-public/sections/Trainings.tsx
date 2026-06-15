'use client';

import Image from 'next/image';
import { BookOpen, Clock, ChevronRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

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
  if (!trainings?.length) return null;

  return (
    <section id="section-trainings" className="scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Formations
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Développez vos compétences avec nos formations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings.map((training) => (
          <div
            key={training.id}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-lg transition-all duration-300"
          >
            {training.image && (
              <div className="aspect-video overflow-hidden relative">
                <Image
                  src={training.image}
                  alt={training.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-5 space-y-4">
              {training.category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand dark:text-brand-400">
                  {training.category}
                </span>
              )}

              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                {training.title}
              </h3>

              {training.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {training.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {training.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {training.duration}
                  </span>
                )}
                {training.lessons && training.lessons > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {training.lessons} leçon{training.lessons > 1 ? 's' : ''}
                  </span>
                )}
                {training.certificate && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Award className="h-3.5 w-3.5" />
                    Certificat
                  </span>
                )}
              </div>

              <Link
                href={businessSlug ? `/business/${businessSlug}/trainings/${training.id}` : '#'}
                className="block"
              >
                <Button variant="outline" className="w-full group/btn">
                  Voir la formation
                  <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
