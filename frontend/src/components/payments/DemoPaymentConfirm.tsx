'use client';

import { useState } from 'react';
import { Smartphone, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';

/**
 * Confirmation de paiement en MODE DÉMONSTRATION (sans clé API FedaPay).
 *
 * Reproduit fidèlement le parcours réel : le paiement reste PENDING
 * (« confirmez sur votre téléphone »), puis le gérant/clients clique
 * « J'ai confirmé (simulation) » → le backend rejoue le webhook FedaPay
 * de production (transaction → paiement → commande → caisse du jour).
 */
export default function DemoPaymentConfirm({
  providerRef,
  amount,
  onConfirmed,
}: {
  providerRef: string;
  amount?: number;
  onConfirmed?: (result: any) => void;
}) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    setStatus('confirming');
    setMessage('');
    try {
      const res: any = await apiClient.confirmDemoPayment(providerRef);
      const data = res?.data?.data;
      setStatus('success');
      setMessage(data?.message || 'Paiement confirmé (mode démonstration).');
      onConfirmed?.(data);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.error || err?.message || 'Échec de la confirmation.');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-semibold">Paiement confirmé ✅</p>
        </div>
        {message && <p className="text-xs text-emerald-600 dark:text-emerald-400">{message}</p>}
        {typeof amount === 'number' && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {amount.toLocaleString()} FCFA enregistrés dans la caisse du jour.
          </p>
        )}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-2">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <XCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Confirmation impossible</p>
        </div>
        {message && <p className="text-xs text-red-600 dark:text-red-400">{message}</p>}
        <Button variant="outline" size="sm" onClick={() => setStatus('pending')}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-3">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <Smartphone className="h-5 w-5" />
        <p className="text-sm font-semibold">Confirmez sur votre téléphone</p>
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-400">
        📲 Mode démonstration — une notification de paiement a été envoyée à votre téléphone.
        Confirmez pour simuler la réponse du réseau mobile money (le webhook FedaPay est rejoué à
        l&apos;identique).
      </p>
      <Button
        size="sm"
        onClick={handleConfirm}
        disabled={status === 'confirming'}
        className="w-full"
      >
        {status === 'confirming' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirmation...
          </span>
        ) : (
          '✅ J’ai confirmé (simulation)'
        )}
      </Button>
    </div>
  );
}
