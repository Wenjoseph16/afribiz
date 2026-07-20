'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader } from '@/components/ui/Loader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Timeout de sécurité : si l'hydratation ne se produit pas après 2s, on force
    const safetyTimeout = setTimeout(() => setHydrated(true), 500);

    // Restaurer manuellement le token depuis localStorage
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken && !useAuthStore.getState().accessToken) {
      useAuthStore.setState({
        accessToken: storedToken,
        refreshToken: localStorage.getItem('refreshToken'),
      });
    }

    // Forcer l'hydratation Zustand
    useAuthStore.persist.rehydrate();

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
      clearTimeout(safetyTimeout);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      clearTimeout(safetyTimeout);
    }

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-gray-500">Redirection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
