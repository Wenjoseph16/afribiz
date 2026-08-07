'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  size = 'md',
  children,
  className,
}: DrawerProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full bg-white dark:bg-gray-900 shadow-2xl z-[70] transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-100 dark:border-gray-800',
          sizeStyles[size],
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {(title || icon) && (
          <header className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 -mr-1"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <footer className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}
