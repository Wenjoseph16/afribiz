'use client';

import Link from 'next/link';
import { useHomeData } from '@/hooks/useHomeData';

const GRADIENTS = [
  'from-pink-500 to-rose-400',
  'from-blue-500 to-indigo-400',
  'from-amber-500 to-orange-400',
  'from-purple-500 to-violet-400',
  'from-cyan-500 to-teal-400',
  'from-emerald-500 to-lime-400',
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

export function SocialProofSection() {
  // Business RÉELS et vérifiés (plus de logos fictifs) — via le hook partagé /api/home
  const { data, isFetched } = useHomeData();
  const businesses = (data?.topBusinesses || []).slice(0, 6);

  if (isFetched && businesses.length === 0) return null;

  return (
    <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider font-medium">
          Déjà des commerces vérifiés nous font confiance en Afrique
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {businesses.map((b, i) => (
            <Link
              key={b.id}
              href={`/business/${b.slug}`}
              className="flex items-center gap-2.5 group"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform`}
              >
                {initials(b.name)}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-brand transition-colors">
                {b.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
