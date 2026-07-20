'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
        const ref = searchParams.get('ref') || searchParams.get('reference');
        const statusParam = searchParams.get('status') || searchParams.get('state');

        if (
          statusParam === 'approved' ||
          statusParam === 'completed' ||
          statusParam === 'success'
        ) {
          setStatus('success');
          setMessage('Votre paiement a été confirmé avec succès.');
          return;
        }

        if (statusParam === 'cancelled' || statusParam === 'failed' || statusParam === 'error') {
          setStatus('error');
          setMessage('Le paiement a été annulé ou a échoué.');
          return;
        }

        if (transactionId) {
          await apiClient.getPayment(transactionId);
          setStatus('success');
          setMessage('Votre paiement a été traité avec succès.');
          return;
        }

        setStatus('success');
        setMessage('Votre paiement a été enregistré.');
      } catch {
        setStatus('error');
        setMessage('Impossible de vérifier le statut du paiement. Contactez le support.');
      }
    };
    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full text-center p-10">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
            <h1 className="text-xl font-semibold">Vérification de votre paiement...</h1>
            <p className="text-sm text-gray-500">Veuillez patienter pendant la confirmation.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-green-600">Paiement réussi !</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="primary" onClick={() => router.push('/dashboard/orders')}>
                Voir mes commandes
              </Button>
              <Button variant="outline" onClick={() => router.push('/marketplace')}>
                <ShoppingBag className="h-4 w-4 mr-1.5" />
                Continuer mes achats
              </Button>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-red-600">Paiement échoué</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="primary" onClick={() => router.push('/checkout')}>
                Réessayer le paiement
              </Button>
              <Button variant="outline" onClick={() => router.push('/support')}>
                Contacter le support
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
