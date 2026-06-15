'use client';

import React from 'react';
import { AuthSlider } from './AuthSlider';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showSlider?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showSlider = true,
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {showSlider && (
          <div className="hidden lg:block relative overflow-hidden bg-emerald-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-950" />
            <div className="relative z-10 flex min-h-screen flex-col">
              <div className="px-6 py-6 sm:px-10 sm:py-8">
                <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-sm">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center text-lg font-semibold text-white">
                    AB
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-white/75">AfriBiz</p>
                    <p className="text-sm font-semibold text-white">La SaaS africaine premium</p>
                  </div>
                </div>
                <div className="mt-8 max-w-xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Votre business africain, tout-en-un.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/80">
                    Gérer vos ventes, vos paiements et vos clients avec élégance et simplicité.
                  </p>
                </div>
              </div>

              <div className="flex-1 px-6 pb-8 sm:px-10">
                <div className="max-w-2xl py-8 lg:py-12">
                  <AuthSlider />
                </div>
              </div>

              <div className="border-t border-white/10 px-6 pb-6 sm:px-10 text-sm text-white/70">
                <div className="flex flex-wrap gap-4">
                  <span>10,000+ businesses</span>
                  <span>2M+ transactions</span>
                  <span>Mobile Money</span>
                  <span>Escrow sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-lg shadow-emerald-500/20">
                  AB
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-600">{subtitle}</p>}
            </div>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
