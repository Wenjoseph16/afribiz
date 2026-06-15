'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

interface SimilarBusinessesProps {
  businessId: string;
  className?: string;
}

export default function SimilarBusinesses({ businessId, className }: SimilarBusinessesProps) {
  const { data: similar, isLoading } = useQuery({
    queryKey: ['similar-businesses', businessId],
    queryFn: async () => {
      const res = await apiClient.getSimilarBusinesses(businessId, 6);
      return res.data.data || [];
    },
    enabled: !!businessId,
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <section className={cn('bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!similar || similar.length === 0) return null;

  return (
    <section className={cn('bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Business similaires</h3>
      </div>

      <div className="space-y-2">
        {similar.map((biz: any) => (
          <Link
            key={biz.id}
            href={`/business/${biz.slug || biz.id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-sm font-bold text-brand shrink-0 overflow-hidden">
              {biz.logo ? (
                <Image src={biz.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : (
                (biz.name || 'B')[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                  {biz.name}
                </p>
                {biz.isVerified && <Shield className="h-3 w-3 text-emerald-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {(biz.rating || 0).toFixed(1)}
                </span>
                {biz.city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {biz.city}
                  </span>
                )}
                <span className="text-gray-400">{biz.type || ''}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
