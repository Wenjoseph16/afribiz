'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useSetupGuard } from '@/hooks/useSetupGuard';
import type { BusinessModule } from '@/types/business';

interface Props {
  module: BusinessModule;
  configureHref?: string;
  children: React.ReactNode;
  action?: string;
}

/**
 * Gatekeeper de configuration : bloque l'action tant que le module
 * n'est pas prêt (ex : pas encore de moyen de paiement). Affiche un
 * tooltip expliquant ce qui manque + un lien vers la configuration.
 */
export function SetupGuard({ module, configureHref, children, action }: Props) {
  const { configured, missing, loading } = useSetupGuard(module);

  if (loading) {
    return <span className="inline-block opacity-40 pointer-events-none">{children}</span>;
  }

  if (configured) return <>{children}</>;

  return (
    <span className="relative inline-block group">
      <span className="pointer-events-none opacity-50 select-none inline-flex">{children}</span>
      <span className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 px-3.5 py-3 rounded-xl bg-gray-900 dark:bg-gray-800 text-gray-100 text-xs shadow-xl border border-gray-700/50 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 transition-all duration-150 pointer-events-none">
        <span className="flex items-center gap-1.5 font-semibold mb-1 text-amber-300">
          <Lock className="h-3 w-3" />
          {action || 'Action à configurer'}
        </span>
        {missing.length > 0 && (
          <span className="block text-gray-300 leading-relaxed">{missing[0]}</span>
        )}
        {configureHref && (
          <span className="mt-2 block pointer-events-auto">
            <Link
              href={configureHref}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Configurer maintenant →
            </Link>
          </span>
        )}
      </span>
    </span>
  );
}
