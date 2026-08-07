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

    // Forcer l'hydratation Zustand D'ABORD : restaure user + selectedSpace depuis
    // auth-storage. Si on fait setState() avant, le middleware persist ré-écrit
    // auth-storage avec l'état vide par défaut (user: null, selectedSpace: 'CLIENT')
    // par-dessus le storage persisté, que rehydrate() lit ensuite -> l'utilisateur
    // est perdu au refresh (espace client + données vides sur toute la plateforme).
    useAuthStore.persist.rehydrate();

    // Restaurer manuellement le token depuis localStorage (fallback si absent du store)
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken && !useAuthStore.getState().accessToken) {
      useAuthStore.setState({
        accessToken: storedToken,
        refreshToken: localStorage.getItem('refreshToken'),
      });
    }

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
