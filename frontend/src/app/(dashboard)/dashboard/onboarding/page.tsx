'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Ancienne page d'onboarding (checklist legacy).
 * Redirige vers le nouveau wizard : /dashboard/business/onboarding
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/business/onboarding');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Redirection vers l&apos;onboarding…</p>
      </div>
    </div>
  );
}
