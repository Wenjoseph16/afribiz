'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  bordered?: boolean;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  titleIcon?: ReactNode;
  action?: ReactNode;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-card hover:shadow-card-hover border border-gray-100 dark:border-gray-700',
  glass: 'glass border border-white/20 dark:border-white/5',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, bordered = true, variant = 'default', padding = 'md', title, titleIcon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300',
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && 'card-hover cursor-pointer',
          !bordered && variant === 'default' && 'border-transparent',
          className
        )}
        {...props}
      >
        {(title || titleIcon || action) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {titleIcon && <span className="text-gray-400">{titleIcon}</span>}
              {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
