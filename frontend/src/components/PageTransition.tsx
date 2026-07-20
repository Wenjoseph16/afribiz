'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const slideFromRight = {
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export function PageTransition({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'slide';
}) {
  const pathname = usePathname();
  const variants = variant === 'slide' ? slideFromRight : pageVariants;

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Loading Skeletons ─────────────────────────────────────

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`card-skeleton-${i}`}
            className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"
          />
        ))}
      </div>
      <div className="space-y-3 mt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-skeleton-${i}`} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 6, height = 48 }: { count?: number; height?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`card-skeleton-${i}`}
          className="bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          style={{ height }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`table-row-${i}`} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
