'use client';

import Image from 'next/image';
import { forwardRef, useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

const statusSizeMap = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
  '2xl': 'h-4 w-4',
};

interface AvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: keyof typeof sizeMap;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, initials, size = 'md', status, className }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div ref={ref} className={cn('relative inline-flex shrink-0', className)}>
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 text-brand dark:text-brand-400 font-semibold',
            sizeMap[size],
            showImage && 'bg-transparent'
          )}
        >
          {showImage ? (
            <Image
              src={src ?? ''}
              alt={alt || ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : initials ? (
            <span className="select-none">{initials.slice(0, 2).toUpperCase()}</span>
          ) : (
            <User className={cn(
              'text-current opacity-60',
              size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : size === 'xl' ? 'h-7 w-7' : 'h-5 w-5'
            )} />
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-gray-900',
              statusColors[status],
              statusSizeMap[size]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
