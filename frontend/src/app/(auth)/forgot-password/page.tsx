'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';
import { Mail, ArrowLeft, Loader2, Send, ChevronLeft } from 'lucide-react';
import { forgotPasswordSchema } from '@/validators/auth';

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const inputBase =
  'w-full h-11 px-4 text-sm rounded-xl border bg-white dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'transition-all duration-200 ease-smooth outline-none ' +
  'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ' +
  'focus:border-brand focus:shadow-[0_0_0_2px_rgba(5,150,105,0.12)] dark:focus:shadow-[0_0_0_2px_rgba(5,150,105,0.25)]';

export default function ForgotPasswordPage() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSending(true);
    try {
      await apiClient.forgotPassword(data.email);
      setSent(true);
      notify({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte de réception pour le lien de réinitialisation.',
        variant: 'success',
      });
    } catch (error: any) {
      notify({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible d\'envoyer l\'email.',
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

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
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Mot de passe oublié
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Entrez votre email pour recevoir le lien de réinitialisation
              </p>
            </motion.div>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center space-y-5"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-brand/10 to-emerald-400/10 dark:from-brand/20 dark:to-emerald-800/20 flex items-center justify-center">
                  <Send className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">Email envoyé !</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    Vérifiez votre boîte de réception et suivez les instructions. Si vous ne trouvez pas l&apos;email, vérifiez vos spams.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="exemple@email.com"
                      autoComplete="email"
                      {...register('email')}
                      className={`${inputBase} pl-10`}
                    />
                  </div>
                  {errors.email?.message && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="relative w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group"
                >
                  {isSending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Envoyer le lien
                      <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
