'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { OtpInput } from '@/components/auth/OtpInput';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { loginSchema } from '@/validators/auth';
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Shield, Loader2, Smartphone, AlertTriangle } from 'lucide-react';

type LoginForm = z.infer<typeof loginSchema>;

interface LoginData {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

const inputBase =
  'w-full h-11 px-4 text-sm rounded-xl border bg-white dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'transition-all duration-200 ease-smooth outline-none ' +
  'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ' +
  'focus:border-brand focus:shadow-[0_0_0_2px_rgba(5,150,105,0.12)] dark:focus:shadow-[0_0_0_2px_rgba(5,150,105,0.25)]';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [requires2FASetup, setRequires2FASetup] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [loginData, setLoginData] = useState<LoginData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const { setTokens, setUser } = useAuthStore();
  const { notify } = useToast();

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
  });

  const identifierValue = watch('identifier');
  const isEmailInput = useMemo(() => {
    if (!identifierValue) return true;
    return identifierValue.includes('@') || !/^[\d+\- ]/.test(identifierValue);
  }, [identifierValue]);

  const getRedirectPath = (user: { primaryRole: string; roles: string[] }) => {
    if (user.primaryRole === 'ADMIN' || user.roles?.includes('ADMIN')) return '/dashboard/admin';
    return '/dashboard';
  };

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiClient.login({ identifier: data.identifier, password: data.password, rememberMe: data.rememberMe });
      if (response.data.success && response.data.data) {
        if (response.data.data.requires2FA) {
          setRequires2FA(true);
          setTempToken(response.data.data.tempToken);
          setLoginData({ identifier: data.identifier, password: data.password, rememberMe: data.rememberMe });
          setIsSubmitting(false);
          return;
        }
        if (response.data.data.requires2FASetup) {
          setRequires2FASetup(true);
          setLoginData({ identifier: data.identifier, password: data.password, rememberMe: data.rememberMe });
          setIsSubmitting(false);
          return;
        }
        const payload = response.data.data;
        setTokens(payload.accessToken, payload.refreshToken);
        setUser(payload.user);
        notify({ title: 'Connexion réussie', variant: 'success' });
        router.push(getRedirectPath(payload.user));
      }
    } catch (error: unknown) {
      notify({
        title: 'Erreur de connexion',
        description: error instanceof Error && 'response' in error ? (error as any).response?.data?.error : 'Identifiants invalides.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!loginData || !totpCode) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.verify2FALogin({
        identifier: loginData.identifier,
        password: loginData.password,
        tempToken,
        totpCode,
        rememberMe: loginData.rememberMe,
      });
      if (response.data.success && response.data.data) {
        const payload = response.data.data;
        setTokens(payload.accessToken, payload.refreshToken);
        setUser(payload.user);
        notify({ title: 'Connexion réussie', variant: 'success' });
        router.push(getRedirectPath(payload.user));
      }
    } catch (error: unknown) {
      notify({
        title: 'Code invalide',
        description: error instanceof Error && 'response' in error ? (error as any).response?.data?.error : 'Le code de vérification est invalide.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isFormSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="relative">
        <div className="relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/30 shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="text-center mb-8"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                Connexion
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Accédez à votre tableau de bord
              </p>
            </motion.div>

            {requires2FASetup ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="2fa-setup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Configuration requise
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Ce compte nécessite la double authentification (2FA) pour des raisons de sécurité.
                      Veuillez d'abord configurer votre 2FA depuis votre profil, ou utilisez un autre compte.
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Comptes recommandés pour les tests :</p>
                        <p><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">business@afribiz.com</code> — Business + Client</p>
                        <p><code className="text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">client@afribiz.com</code> — Client uniquement</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setRequires2FASetup(false); setLoginData(null); }}
                    className="w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 transition-all duration-200"
                  >
                    Retour à la connexion
                  </button>
                </motion.div>
              </AnimatePresence>
            ) : requires2FA ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key="2fa"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-brand/10 to-emerald-400/10 dark:from-brand/20 dark:to-emerald-800/20 flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6 text-brand" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Double authentification
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Saisissez le code généré par votre application
                    </p>
                  </div>
                  <div className="flex justify-center py-2">
                    <OtpInput
                      length={6}
                      onComplete={setTotpCode}
                      disabled={busy}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy || totpCode.length !== 6}
                    onClick={handleVerify2FA}
                    className="relative w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Vérification...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Vérifier
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRequires2FA(false); setTempToken(''); setTotpCode(''); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Retour à la connexion
                  </button>
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Identifier */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email ou téléphone
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus-within:text-brand transition-colors duration-200">
                      {isEmailInput ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      placeholder={isEmailInput ? 'exemple@email.com' : '+228 90 00 00 00'}
                      inputMode={isEmailInput ? 'email' : 'tel'}
                      autoComplete={isEmailInput ? 'email' : 'tel'}
                      {...register('identifier')}
                      className={`${inputBase} pl-10`}
                    />
                  </div>
                  {errors.identifier?.message && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                      {errors.identifier.message}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 peer-focus-within:text-brand transition-colors duration-200 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Entrez votre mot de passe"
                      autoComplete="current-password"
                      {...register('password')}
                      className={`${inputBase} pl-10 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password?.message && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400 shrink-0" />
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/30 focus:ring-offset-0 bg-white dark:bg-gray-800 cursor-pointer transition-colors"
                      {...register('rememberMe')}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                      Se souvenir de moi
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors shrink-0"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="relative w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Connexion en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>

                {/* Signup link */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Pas encore de compte ?{' '}
                  <Link href="/signup" className="font-semibold text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    Créez-en un
                  </Link>
                </p>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
