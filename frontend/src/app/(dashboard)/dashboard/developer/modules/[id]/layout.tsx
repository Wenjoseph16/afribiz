'use client';

import { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Shield, Key, Settings, FileCheck, Layers,
  ChevronLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModule } from '@/features/developerHooks';

const TABS = [
  { key: '', label: 'Aperçu', icon: Package, href: '' },
  { key: 'permissions', label: 'Permissions', icon: Shield, href: '/permissions' },
  { key: 'validation', label: 'Validation', icon: FileCheck, href: '/validation' },
  { key: 'configuration', label: 'Configuration', icon: Settings, href: '/configuration' },
];

export default function ModuleDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const moduleId = params?.id as string;

  const { data: mod, isLoading, error, refetch } = useDeveloperModule(moduleId);

  const currentTab = useMemo(() => {
    const base = `/dashboard/developer/modules/${moduleId}`;
    const rest = pathname.replace(base, '').replace(/^\//, '');
    return TABS.find((t) => t.key === rest)?.key || '';
  }, [pathname, moduleId]);

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!mod) return null;

  const baseUrl = `/dashboard/developer/modules/${moduleId}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={mod.name}
        description={mod.shortDescription || `v${mod.version || '1.0.0'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Modules', href: '/dashboard/developer/modules' },
          { label: mod.name },
        ]}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`${baseUrl}${tab.href}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
              currentTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
