'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo AfriBiz - lien vers la page d'accueil */}
      <Link href="/" className="mb-8 group">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
          <span className="text-xl font-extrabold tracking-tight text-brand">AfriBiz</span>
        </div>
      </Link>

      {/* Card centrée */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} AfriBiz. Tous droits réservés.
      </p>
    </div>
  );
}
