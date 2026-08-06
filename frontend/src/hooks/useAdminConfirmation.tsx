'use client';

import { useCallback, useState } from 'react';
import AdminConfirmationModal, {
  ConfirmationRequest,
} from '@/components/dashboard/AdminConfirmationModal';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  requiresOtp?: boolean;
  /** Exécute l'action sensible avec les identifiants de confirmation. Doit rejeter en cas d'échec. */
  action: (creds: { adminPassword: string; otpCode?: string }) => Promise<void>;
}

/**
 * Double validation des actions admin sensibles.
 *
 * Usage :
 *   const { requestConfirmation, modal } = useAdminConfirmation();
 *   const ok = await requestConfirmation({
 *     title: 'Geler ce compte',
 *     description: '...',
 *     danger: true,
 *     action: async (creds) => { await apiClient.post('/admin/users/x/freeze', { ...creds }); },
 *   });
 *   if (ok) { l'action a réussi }
 *   ... = { modal }
 */
export function useAdminConfirmation() {
  const [request, setRequest] = useState<ConfirmationRequest | null>(null);

  const requestConfirmation = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel,
        danger: opts.danger,
        requiresOtp: opts.requiresOtp ?? false,
        onConfirm: async (creds) => {
          // Si l'action rejette, la modale capte l'erreur et reste ouverte
          await opts.action(creds);
          resolve(true);
          setRequest(null);
        },
        onCancel: () => {
          resolve(false);
          setRequest(null);
        },
      });
    });
  }, []);

  const modal = request ? <AdminConfirmationModal request={request} /> : null;

  return { requestConfirmation, modal };
}
