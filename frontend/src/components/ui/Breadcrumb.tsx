import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex items-center gap-1 text-sm text-gray-500', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-brand transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && 'text-gray-900 dark:text-gray-100 font-medium')}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
