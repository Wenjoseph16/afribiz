'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Code, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useDeveloperProfile } from '@/features/developerHooks';
import { Button } from '@/components/ui/Button';

/**
 * Guard d'accès à l'espace Développeur.
 *
 * Protège TOUTES les routes /dashboard/developer/* (pas seulement la page
 * racine comme avant). Trois conditions :
 *   1. L'utilisateur DOIT avoir le rôle DEVELOPER.
 *   2. L'utilisateur DOIT avoir terminé l'onboarding (profil développeur existant).
 *   3. Le compte DOIT être validé par l'admin (KYC vérifié) — sinon le dev est
 *      renvoyé à l'onboarding où il voit le statut/motif et peut refaire son KYC.
 *
 * Sans quoi il est redirigé :
 *   - pas de rôle DEVELOPER            → /dashboard/become-developer
 *   - rôle DEVELOPER mais onboarding  → /dashboard/developer/onboarding
 *     non terminé
 *   - onboarding fait mais KYC non    → /dashboard/developer/onboarding
 *     validé (PENDING/REJECTED)
 *
 * La page d'onboarding elle-même est exemptée (sinon boucle infinie).
 */
export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useDeveloperProfile();

  const hasDeveloperRole = !!user?.roles?.includes('DEVELOPER');
  const isOnboardingPage = pathname === '/dashboard/developer/onboarding';
  const isVerified = profile?.verificationStatus === 'VERIFIED';

  // Chargement initial du store / du profil
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user) return;

    // 1. Pas le rôle DEVELOPER → page "devenir développeur"
    if (!hasDeveloperRole) {
      if (!isOnboardingPage) {
        router.replace('/dashboard/become-developer');
      }
      return;
    }

    // 2. Onboarding non terminé (pas de profil développeur) → forcer l'onboarding
    if (!isOnboardingPage && !profile && !profileLoading) {
      router.replace('/dashboard/developer/onboarding');
      return;
    }

    // 3. KYC non validé par l'admin → retour à l'onboarding (statut + motif visibles)
    if (!isOnboardingPage && profile && !profileLoading && !isVerified) {
      router.replace('/dashboard/developer/onboarding');
    }
  }, [
    hydrated,
    user,
    hasDeveloperRole,
    isOnboardingPage,
    profile,
    profileLoading,
    isVerified,
    router,
  ]);

  // Rendu : pages de garde pendant les transitions
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Pas développeur : afficher un écran de redirection vers "devenir développeur"
  if (!hasDeveloperRole) {
    if (isOnboardingPage) return <>{children}</>;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Code className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Accès réservé aux développeurs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Activez votre compte développeur pour accéder à la marketplace de modules AfriBiz.
          </p>
          <Link href="/dashboard/become-developer">
            <Button size="lg" variant="gradient">
              Devenir développeur
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Rôle DEVELOPER mais profil non chargé / non terminé (hors page onboarding)
  if (!isOnboardingPage && (profileLoading || profileError)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // KYC non validé : ne jamais rendre le dashboard, rediriger vers l'onboarding
  if (!isOnboardingPage && profile && !isVerified) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
