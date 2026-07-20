'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Save,
  Globe,
  DollarSign,
  Bell,
  Lock,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Mail,
  Shield,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useProfile, useUpdateProfile } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const inputClass =
  'w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Togo',
    city: '',
    address: '',
    language: 'Français',
    currency: 'FCFA',
  });
  const [activeSection, setActiveSection] = useState('info');

  useEffect(() => {
    const p = profile || user;
    if (p) {
      setForm((prev) => ({
        ...prev,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        city: (p as Record<string, string>).city || '',
        address: (p as Record<string, string>).address || '',
        country: (p as Record<string, string>).country || 'Togo',
        language: (p as Record<string, string>).language || 'Français',
        currency: (p as Record<string, string>).currency || 'FCFA',
      }));
      setAvatarUrl((p as Record<string, string | null>).avatar || null);
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await apiClient.uploadAvatar(file);
      setAvatarUrl(res.data.data.avatar);
      refetch();
    } catch {
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    updateProfile.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      country: form.country,
      city: form.city,
      address: form.address,
      language: form.language,
      currency: form.currency,
    });
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const initials =
    form.firstName && form.lastName
      ? `${form.firstName[0]}${form.lastName[0]}`
      : form.email[0]?.toUpperCase() || '?';

  const sections = [
    { id: 'info', label: 'Informations', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Globe },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles et préférences"
        breadcrumbs={[{ label: 'Profil' }]}
        actions={
          <Button onClick={handleSubmit} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        }
      />

      {/* Profile Hero Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-6 sm:p-8">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-700 shadow-lg flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 hover:scale-110 group"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-emerald-100 text-xs font-medium mb-3 border border-white/10">
                <BadgeCheck className="h-3 w-3" />
                Compte vérifié
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {form.firstName} {form.lastName}
              </h2>
              <p className="text-emerald-100/80 mt-1">{form.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                <Badge variant="brand" size="sm">
                  Client AfriBiz
                </Badge>
                <Badge variant="success" size="sm">
                  Actif
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation sections tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-1 bg-white dark:bg-gray-800/50 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-fit">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                activeSection === sec.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <sec.icon className="h-3.5 w-3.5" />
              {sec.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Informations personnelles */}
        {activeSection === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Informations personnelles
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    Nom
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.email}
                      disabled
                      className={cn(
                        inputClass,
                        'bg-gray-50 dark:bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      )}
                    />
                    <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+225 XX XX XX XX"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    Pays
                  </label>
                  <Select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    options={[
                      { value: 'Togo', label: 'Togo' },
                      { value: 'Bénin', label: 'Bénin' },
                      { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
                      { value: 'Ghana', label: 'Ghana' },
                      { value: 'Sénégal', label: 'Sénégal' },
                      { value: 'Mali', label: 'Mali' },
                      { value: 'Niger', label: 'Niger' },
                      { value: 'Nigeria', label: 'Nigeria' },
                      { value: 'Burkina Faso', label: 'Burkina Faso' },
                      { value: 'Guinée', label: 'Guinée' },
                    ]}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Votre ville"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Votre adresse complète"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Préférences */}
        {activeSection === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Préférences
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <Globe className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Langue
                    </span>
                  </div>
                  <Select
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    options={[
                      { value: 'Français', label: 'Français' },
                      { value: 'English', label: 'English' },
                      { value: 'Ewe', label: 'Ewe' },
                      { value: 'Yoruba', label: 'Yoruba' },
                    ]}
                  />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <DollarSign className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Devise
                    </span>
                  </div>
                  <Select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    options={[
                      { value: 'FCFA', label: 'FCFA' },
                      { value: 'GHS', label: 'GHS' },
                      { value: 'NGN', label: 'NGN' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'USD', label: 'USD' },
                    ]}
                  />
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </span>
                  </div>
                  <Link
                    href="/dashboard/notifications"
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-blue-700 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
                  >
                    Configurer
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Sécurité */}
        {activeSection === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5 text-brand" />
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sécurité
                </h3>
              </div>

              <div className="space-y-3">
                <Link
                  href="/dashboard/security"
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border border-gray-100 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Mot de passe & sécurité
                      </p>
                      <p className="text-xs text-gray-500">
                        Changer votre mot de passe, gérer la 2FA et les sessions actives
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border border-gray-100 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Confidentialité & données
                      </p>
                      <p className="text-xs text-gray-500">
                        Gérer vos données personnelles et préférences de confidentialité
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Bottom save button for mobile */}
      <motion.div
        variants={itemVariants}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden z-50"
      >
        <Button
          onClick={handleSubmit}
          disabled={updateProfile.isPending}
          className="shadow-xl shadow-brand/20"
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
