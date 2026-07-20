'use client';

import { Skeleton, SkeletonStats, SkeletonTable } from './Skeleton';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  variant?: 'list' | 'detail' | 'dashboard' | 'form';
  rows?: number;
  className?: string;
}

export function PageSkeleton({ variant = 'list', rows = 5, className }: PageSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={4} />
          <SkeletonTable rows={3} />
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={cn('space-y-5 animate-pulse', className)}>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    );
  }

  // list variant (default)
  return (
    <div className={cn('space-y-5 animate-pulse', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonStats />
      <SkeletonTable rows={rows} />
    </div>
  );
}
