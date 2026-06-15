'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bar';
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function Loader({ size = 'md', variant = 'spinner', label, fullScreen, className }: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn('animate-spin text-brand', sizeMap[size])} />
          {label && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{label}</p>}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full bg-brand animate-bounce',
              size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        {label && <span className="ml-2 text-sm text-gray-500">{label}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className={cn('rounded-full bg-brand/30 animate-ping', sizeMap[size])} />
        {label && <p className="text-sm text-gray-500">{label}</p>}
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={cn('w-full', className)}>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full animate-shimmer w-1/3" />
        </div>
        {label && <p className="mt-2 text-sm text-gray-500 text-center">{label}</p>}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-brand', sizeMap[size])} />
      {label && <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>}
    </div>
  );
}
