'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';
import { Lock, Eye, EyeOff, Loader2, Shield, ChevronLeft } from 'lucide-react';
import { resetPasswordSchema } from '@/validators/auth';

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const inputBase =
  'w-full h-11 px-4 text-sm rounded-xl border bg-white dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'transition-all duration-200 ease-smooth outline-none ' +
  'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ' +
  'focus:border-brand focus:shadow-[0_0_0_2px_rgba(5,150,105,0.12)] dark:focus:shadow-[0_0_0_2px_rgba(5,150,105,0.25)]';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { notify } = useToast();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema as any),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  useEffect(() => {
    setToken(searchParams?.get('token') ?? null);
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      notify({ title: 'Token manquant', description: 'Le lien de réinitialisation est invalide.', variant: 'error' });
      return;
    }

    setIsResetting(true);
    try {
      await apiClient.resetPassword(token, data.password);
      notify({ title: 'Mot de passe réinitialisé', variant: 'success' });
      router.push('/login');
    } catch (error: any) {
      notify({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible de réinitialiser le mot de passe.',
        variant: 'error',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const fieldError = (msg?: string) =>
    msg ? (
      <motion.p
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
      >
        <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
        {msg}
      </motion.p>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="relative">
        {/* Glow orbes */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand/10 dark:bg-brand/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-300/10 dark:bg-emerald-700/10 rounded-full blur-3xl" />

        <div className="relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/30 shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 shadow-lg shadow-brand/20 mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Réinitialiser le mot de passe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Choisissez un nouveau mot de passe sécurisé
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Créez un mot de passe sécurisé"
                    autoComplete="new-password"
                    {...register('password')}
                    className={`${inputBase} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldError(errors.password?.message)}
                <PasswordStrengthMeter password={passwordValue || ''} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`${inputBase} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldError(errors.confirmPassword?.message)}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isResetting}
                className="relative w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group"
              >
                {isResetting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Réinitialisation en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Réinitialiser
                    <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </span>
                )}
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
