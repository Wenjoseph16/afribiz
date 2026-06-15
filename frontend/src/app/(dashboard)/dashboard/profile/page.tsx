'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Globe, DollarSign, Bell, Lock } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useProfile, useUpdateProfile } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

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

  useEffect(() => {
    const p = profile || user;
    if (p) {
      setForm((prev) => ({
        ...prev,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        city: (p as any).city || '',
        address: (p as any).address || '',
        country: (p as any).country || 'Togo',
        language: (p as any).language || 'Français',
        currency: (p as any).currency || 'FCFA',
      }));
      setAvatarUrl((p as any).avatar || null);
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

  const initials = form.firstName && form.lastName
    ? `${form.firstName[0]}${form.lastName[0]}`
    : form.email[0]?.toUpperCase() || '?';

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles et préférences"
        breadcrumbs={[{ label: 'Profil' }]}
        actions={
          <Button onClick={handleSubmit} disabled={updateProfile.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Photo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <Image src={avatarUrl ?? ''} alt="Avatar" width={80} height={80} className="rounded-full object-cover shadow-md" unoptimized />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{form.firstName} {form.lastName}</p>
              <p className="text-sm text-gray-500">{form.email}</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">Client AfriBiz</p>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Informations personnelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={form.email}
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option>Togo</option>
                <option>Bénin</option>
                <option>Côte d&apos;Ivoire</option>
                <option>Ghana</option>
                <option>Sénégal</option>
                <option>Mali</option>
                <option>Niger</option>
                <option>Nigeria</option>
                <option>Burkina Faso</option>
                <option>Guinée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sécurité</h3>
          <Link href="/dashboard/security" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600"><Lock className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Mot de passe & sécurité</p>
                <p className="text-xs text-gray-500">Changer votre mot de passe, gérer la 2FA et les sessions</p>
              </div>
            </div>
            <span className="text-sm text-emerald-700 font-medium group-hover:mr-1 transition-all">Modifier →</span>
          </Link>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Préférences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Globe className="h-4 w-4 text-gray-400" />
                Langue
              </label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option>Français</option>
                <option>English</option>
                <option>Ewe</option>
                <option>Yoruba</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Devise
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              >
                <option>FCFA</option>
                <option>GHS</option>
                <option>NGN</option>
                <option>EUR</option>
                <option>USD</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Bell className="h-4 w-4 text-gray-400" />
                Notifications
              </label>
              <Link
                href="/dashboard/notifications"
                className="block w-full px-3 py-2 text-sm text-emerald-700 font-medium border border-gray-200 rounded-lg hover:bg-emerald-50 transition-colors text-center"
              >
                Configurer →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
