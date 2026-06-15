'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { signupSchema } from '@/validators/auth';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Loader2, MapPin, Calendar, Globe, Phone } from 'lucide-react';

const inputBase =
  'w-full h-11 px-4 text-sm rounded-xl border bg-white dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
  'transition-all duration-200 ease-smooth outline-none ' +
  'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 ' +
  'focus:border-brand focus:shadow-[0_0_0_2px_rgba(5,150,105,0.12)] dark:focus:shadow-[0_0_0_2px_rgba(5,150,105,0.25)]';

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setTokens, setUser } = useAuthStore();
  const { notify } = useToast();

  const {
    register,
    watch,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema as any),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      country: '',
      region: '',
      city: '',
      neighborhood: '',
      birthDate: '',
      gender: undefined,
      termsAccepted: false,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);
    try {
      const [firstName, ...rest] = data.fullName.trim().split(' ');
      const lastName = rest.length ? rest.join(' ') : data.fullName.trim();
      const response = await apiClient.signup({
        firstName,
        lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone,
        country: data.country,
        region: data.region,
        city: data.city,
        neighborhood: data.neighborhood,
        birthDate: data.birthDate || undefined,
        gender: data.gender || undefined,
        termsAccepted: data.termsAccepted,
      });

      if (response.data.success && response.data.data) {
        const payload = response.data.data;
        setTokens(payload.accessToken, payload.refreshToken);
        setUser(payload.user);
        notify({ title: 'Compte créé', description: 'Vérifiez votre email pour finaliser l\'inscription.', variant: 'success' });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error: any) {
      notify({
        title: 'Erreur d\'inscription',
        description: error?.response?.data?.error || 'Impossible de créer le compte.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
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
      className="w-full"
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
                Créer un compte
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Rejoignez AfriBiz en quelques secondes
              </p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Koffi Kouassi"
                    autoComplete="name"
                    {...register('fullName')}
                    className={`${inputBase} pl-10`}
                  />
                </div>
                {fieldError(errors.fullName?.message)}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
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
                {fieldError(errors.email?.message)}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`${inputBase} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldError(errors.confirmPassword?.message)}
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone <span className="text-red-400">*</span>
                    </label>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.phone?.message}
                    />
                  </div>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pays <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input type="text" placeholder="Togo" {...register('country')} className={`${inputBase} pl-10`} />
                  </div>
                  {fieldError(errors.country?.message)}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Région <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input type="text" placeholder="Maritime" {...register('region')} className={`${inputBase} pl-10`} />
                  </div>
                  {fieldError(errors.region?.message)}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ville <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input type="text" placeholder="Lomé" {...register('city')} className={`${inputBase} pl-10`} />
                  </div>
                  {fieldError(errors.city?.message)}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quartier <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input type="text" placeholder="Adidogomé" {...register('neighborhood')} className={`${inputBase} pl-10`} />
                  </div>
                  {fieldError(errors.neighborhood?.message)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de naissance</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input type="date" {...register('birthDate')} className={`${inputBase} pl-10`} />
                  </div>
                  {fieldError(errors.birthDate?.message)}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Genre</label>
                  <select {...register('gender')} className={`${inputBase} cursor-pointer`}>
                    <option value="">Non spécifié</option>
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Féminin</option>
                    <option value="OTHER">Autre</option>
                  </select>
                  {fieldError(errors.gender?.message)}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group pt-1">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/30 focus:ring-offset-0 bg-white dark:bg-gray-800 cursor-pointer shrink-0 transition-colors"
                  {...register('termsAccepted')}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors leading-5">
                  J&apos;accepte les{' '}
                  <Link href="/terms" className="text-brand hover:text-brand-600 dark:hover:text-brand-400 font-medium">
                    conditions d&apos;utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/privacy" className="text-brand hover:text-brand-600 dark:hover:text-brand-400 font-medium">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              {fieldError(errors.termsAccepted?.message)}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Création en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Créer mon compte
                    <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </span>
                )}
              </button>

              {/* Login link */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Déjà inscrit ?{' '}
                <Link href="/login" className="font-semibold text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Connectez-vous
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
