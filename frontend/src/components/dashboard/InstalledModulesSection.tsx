'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconMap } from './sidebar-data';
import { useBusinessInstalledModules } from '@/features/developerHooks';

/**
 * Section dynamique « Modules installés » de la sidebar business.
 * - N'apparaît que si le business a des installations ACTIVES avec un dashboardUrl.
 * - Chaque module pointe vers sa page runtime (iframe sandbox).
 * - Icônes issues du manifeste du module (sidebarIcon) avec fallback Package.
 */
export function InstalledModulesSection({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { data: installations } = useBusinessInstalledModules();

  const activeModules = Array.isArray(installations)
    ? (installations as any[]).filter(
        (i: any) =>
          i.status === 'ACTIVE' &&
          !i.trialExpired &&
          i.module?.dashboardUrl &&
          /^https:\/\//.test(i.module.dashboardUrl)
      )
    : [];

  if (activeModules.length === 0) return null;

  return (
    <div className="mb-1">
      {!collapsed && (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 dark:text-white/30 uppercase tracking-[0.15em]">
          Modules installés
        </p>
      )}
      <div className={cn(collapsed ? 'space-y-0.5' : 'mt-0.5 space-y-0.5')}>
        {activeModules.map((inst: any) => {
          const mod = inst.module;
          const Icon = iconMap[mod.sidebarIcon] || Package;
          const active = pathname === `/dashboard/business/modules/${inst.id}`;
          return (
            <Link
              key={inst.id}
              href={`/dashboard/business/modules/${inst.id}`}
              title={collapsed ? mod.sidebarLabel || mod.name : undefined}
              className={cn(
                'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2',
                active
                  ? 'bg-indigo-500/20 text-indigo-200 shadow-sm'
                  : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-white/5'
              )}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-400 rounded-r-full" />
              )}
              <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
              {!collapsed && <span className="truncate">{mod.sidebarLabel || mod.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
