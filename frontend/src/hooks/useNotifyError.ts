'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

/**
 * Hook utilitaire qui combine notification toast + console.error.
 * Utilisez-le dans les catch-blocks pour remplacer les `console.error` silencieux.
 *
 * Usage:
 * ```ts
 * const notifyError = useNotifyError();
 * try { ... } catch (e) { notifyError(e, 'Échec du chargement'); }
 * ```
 */
export function useNotifyError() {
  const { notify } = useToast();

  const notifyError = useCallback(
    (error: unknown, title = 'Erreur', description?: string) => {
      const message =
        error instanceof Error ? error.message : String(error || 'Erreur inconnue');

      // Toujours logger l'erreur complète en console
      console.error(`[${title}]`, error);

      // Notifier l'utilisateur
      notify({
        variant: 'error',
        title,
        description: description || message,
      });
    },
    [notify]
  );

  return notifyError;
}
