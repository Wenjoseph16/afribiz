'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  className?: string;
}

export function ErrorState({
  icon,
  title = 'Une erreur est survenue',
  message = 'Impossible de charger les données. Veuillez réessayer.',
  onRetry,
  fullScreen,
  className,
}: ErrorStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center py-20 px-4', className)}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/20 border border-red-100/50 dark:border-red-800/30 flex items-center justify-center mb-5 text-red-400 dark:text-red-400/60 shadow-sm shadow-red-100/50 dark:shadow-red-900/20">
        {icon || <AlertTriangle className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Réessayer
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}
