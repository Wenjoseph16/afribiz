'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMyBusiness } from '@/features/hooks/business';
import { Button } from '@/components/ui/Button';

/**
 * Guard d'accès à l'espace Business.
 *
 * Protège TOUTES les routes /dashboard/business/* (pas seulement la page
 * racine comme avant). Deux conditions :
 *   1. L'utilisateur DOIT avoir le rôle BUSINESS.
 *   2. L'utilisateur DOIT avoir terminé l'onboarding (profil business existant).
 *
 * Sans quoi il est redirigé :
 *   - pas de rôle BUSINESS            → /dashboard/become-business
 *   - rôle BUSINESS mais onboarding   → /dashboard/business/onboarding
 *     non terminé (pas de profil)
 *
 * La page d'onboarding elle-même est exemptée (sinon boucle infinie), car
 * le wizard crée le profil business et attribue le rôle BUSINESS à sa fin.
 */
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: myBusiness, isLoading: bizLoading, isError: bizError } = useMyBusiness();

  const hasBusinessRole = !!user?.roles?.includes('BUSINESS');
  const isOnboardingPage = pathname === '/dashboard/business/onboarding';

  // Chargement initial du store / du profil
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;

    // 1. Pas le rôle BUSINESS → page "devenir business"
    if (!hasBusinessRole) {
      if (!isOnboardingPage) {
        router.replace('/dashboard/become-business');
      }
      return;
    }

    // 2. Onboarding non terminé (pas de profil business) → forcer l'onboarding
    if (!isOnboardingPage && !myBusiness && !bizLoading && !bizError) {
      router.replace('/dashboard/business/onboarding');
    }
  }, [hydrated, user, hasBusinessRole, isOnboardingPage, myBusiness, bizLoading, bizError, router]);

  // Rendu : pages de garde pendant les transitions
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Pas business : afficher un écran de redirection vers "devenir business"
  if (!hasBusinessRole) {
    if (isOnboardingPage) return <>{children}</>;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Accès réservé aux business
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Activez votre compte business pour accéder à votre espace professionnel AfriBiz.
          </p>
          <Link href="/dashboard/become-business">
            <Button size="lg" variant="gradient">
              Devenir business
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Rôle BUSINESS mais profil non chargé (hors page onboarding)
  if (!isOnboardingPage && bizLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
