'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    apiClient.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || err?.message || 'Échec de la vérification. Le lien est peut-être expiré.');
      });
  }, [token]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl shadow-slate-900/5">
          <Loader variant="spinner" size="lg" className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vérification en cours...</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Veuillez patienter pendant la vérification de votre email.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl shadow-slate-900/5">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Email vérifié !</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <Button onClick={() => router.push('/login')} fullWidth>
            Se connecter
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl shadow-slate-900/5">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Échec de la vérification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/login')} variant="outline" fullWidth>
              <Mail className="h-4 w-4 mr-2" />
              Connexion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader variant="spinner" size="lg" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
