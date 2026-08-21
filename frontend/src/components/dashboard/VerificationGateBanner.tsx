'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowRight, BadgeCheck, Clock } from 'lucide-react';
import { useDeveloperProfile } from '@/features/developerHooks';

/**
 * Encart affiché tant que l'identité du développeur n'est pas VERIFIED.
 * Le backend refuse la publication (403) — ce banner explique pourquoi
 * et renvoie vers l'étape vérification de l'onboarding.
 */
export default function VerificationGateBanner() {
  const { data: profile } = useDeveloperProfile();
  const status = profile?.verificationStatus;

  if (!profile || status === 'VERIFIED') return null;

  if (status === 'PENDING') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 animate-fade-in">
        <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">Vérification en cours d&apos;examen</p>
          <p className="mt-0.5 text-xs">
            La publication de vos modules sera débloquée dès validation de votre identité par
            l&apos;équipe AfriBiz (sous 48h ouvrées).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 animate-fade-in">
      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-[220px] text-sm text-amber-800 dark:text-amber-300">
        <p className="font-semibold">Vérification d&apos;identité requise pour publier</p>
        <p className="mt-0.5 text-xs">
          {status === 'REJECTED'
            ? 'Votre dossier a été refusé. Soumettez des documents conformes pour réessayer.'
            : 'Soumettez votre pièce d’identité depuis l’onboarding développeur pour débloquer la publication.'}
        </p>
      </div>
      <Link
        href="/dashboard/developer/onboarding"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0"
      >
        {status === 'REJECTED' ? (
          <>
            <BadgeCheck className="h-4 w-4" /> Corriger mon dossier
          </>
        ) : (
          <>
            Vérifier mon identité <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Link>
    </div>
  );
}
