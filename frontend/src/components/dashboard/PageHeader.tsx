'use client';

import { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  className?: string;
  gradient?: boolean;
}

export function PageHeader({ title, description, breadcrumbs, actions, className, gradient }: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link href="/dashboard" className="hover:text-brand dark:hover:text-brand-400 transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-brand dark:hover:text-brand-400 transition-colors font-medium">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="max-w-xl">
          {gradient ? (
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{title}</h1>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
          )}
          {description && (
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
