'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Building2, Globe, Code2, ExternalLink, MapPin, Phone, Mail,
  Save, X, User, Briefcase, Star, Package, Shield, Check,
  Camera, Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useDeveloperProfile, useUpdateDeveloperProfile } from '@/features/developerHooks';

export default function DeveloperProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useDeveloperProfile();
  const updateProfile = useUpdateDeveloperProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    companyName: '', bio: '', website: '', github: '', linkedin: '',
    portfolio: '', country: '', city: '', phone: '', professionalEmail: '',
    whatsapp: '', address: '', experience: '',
    specialties: [] as string[], technologies: [] as string[],
  });
  const [specInput, setSpecInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName || '',
        bio: profile.publicDescription || '',
        experience: profile.experience ? `${profile.experience}` : '',
        specialties: profile.specialties || [],
        technologies: profile.technologies || [],
        website: profile.website || '',
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        portfolio: profile.portfolio || '',
        country: profile.country || '',
        city: profile.city || '',
        phone: profile.phone || '',
        professionalEmail: profile.professionalEmail || '',
        whatsapp: profile.whatsapp || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const updateField = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = (key: 'specialties' | 'technologies', input: string) => {
    const v = input.trim();
    if (v && !form[key].includes(v)) {
      updateField(key, [...form[key], v]);
      if (key === 'specialties') setSpecInput('');
      else setTechInput('');
    }
  };

  const removeTag = (key: 'specialties' | 'technologies', value: string) =>
    updateField(key, form[key].filter((x) => x !== value));

  const handleAvatarUpload = (file: File) => {
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setAvatarUploading(false);
    };
    reader.onerror = () => setAvatarUploading(false);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        companyName: form.companyName || null,
        publicDescription: form.bio || null,
        specialties: form.specialties,
        technologies: form.technologies,
        website: form.website || null,
        github: form.github || null,
        linkedin: form.linkedin || null,
        portfolio: form.portfolio || null,
        country: form.country || null,
        city: form.city || null,
        phone: form.phone || null,
        professionalEmail: form.professionalEmail || null,
        yearsOfExperience: form.experience ? Number(form.experience) : null,
        whatsapp: form.whatsapp || null,
        address: form.address || null,
        photo: avatarPreview || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
  };

  const verifVariant = profile?.verificationStatus === 'VERIFIED' ? 'success'
    : profile?.verificationStatus === 'REJECTED' ? 'danger' : 'warning';

  if (isLoading) return <Loader size="lg" label="Chargement du profil..." />;
  if (isError) {
    return (
      <EmptyState
        icon={<User className="h-12 w-12" />}
        title="Profil non trouvé"
        description="Activez votre rôle développeur pour accéder à cette page."
        action={<Link href="/dashboard/developer/onboarding"><Button variant="gradient">Devenir développeur</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Profil développeur"
        description="Gérez votre identité professionnelle sur AfriBiz"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Profil' },
        ]}
        actions={
          <Button onClick={handleSave} isLoading={updateProfile.isPending} variant={saved ? 'primary' : 'gradient'}>
            {saved ? <><Check className="h-4 w-4" /> Enregistré</> : <><Save className="h-4 w-4" /> Enregistrer</>}
          </Button>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Star className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Note</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(profile?.rating || 0).toFixed(1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Modules</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(profile as any)?.stats?.totalModules || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Shield className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Vérification</p>
              <Badge variant={verifVariant} size="sm">
                {profile?.verificationStatus === 'VERIFIED' ? 'Vérifié' :
                 profile?.verificationStatus === 'REJECTED' ? 'Rejeté' : 'En attente'}
              </Badge>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Membre depuis</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Avatar + General Info */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700',
                'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800',
                'flex items-center justify-center'
              )}>
                {avatarPreview || profile?.photo || profile?.companyLogo ? (
                  <Image
                    src={avatarPreview || profile?.photo || profile?.companyLogo || ''}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {avatarUploading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">Photo de profil</p>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Nom de l'entreprise *"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                icon={<Building2 className="h-4 w-4" />}
                placeholder="Ma société de développement"
              />
              <Input
                label="Années d'expérience"
                value={form.experience}
                onChange={(e) => updateField('experience', e.target.value)}
                icon={<Briefcase className="h-4 w-4" />}
                type="number"
                min={0}
                max={100}
                placeholder="Ex: 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio / Présentation</label>
              <textarea
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
                placeholder="Présentez votre activité et votre expertise..."
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3 mb-5">
          Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Email professionnel"
            value={form.professionalEmail}
            onChange={(e) => updateField('professionalEmail', e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="contact@masociete.com"
          />
          <Input
            label="Téléphone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            icon={<Phone className="h-4 w-4" />}
            placeholder="+228 90 00 00 00"
          />
          <Input
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => updateField('whatsapp', e.target.value)}
            icon={<Phone className="h-4 w-4" />}
            placeholder="+228 90 00 00 00"
          />
          <Input
            label="Pays"
            value={form.country}
            onChange={(e) => updateField('country', e.target.value)}
            icon={<MapPin className="h-4 w-4" />}
            placeholder="Togo"
          />
          <Input
            label="Ville"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            icon={<MapPin className="h-4 w-4" />}
            placeholder="Lomé"
          />
          <Input
            label="Adresse"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            icon={<MapPin className="h-4 w-4" />}
            placeholder="Rue, quartier, lot..."
          />
        </div>
      </Card>

      {/* Skills */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3 mb-5">
          Compétences
        </h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spécialités</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.specialties.length === 0 && (
                <span className="text-xs text-gray-400 italic px-1">Ajoutez vos domaines d'expertise</span>
              )}
              {form.specialties.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand text-sm font-medium">
                  {s}
                  <button onClick={() => removeTag('specialties', s)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                placeholder="Ex: E-commerce, Paiement..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('specialties', specInput); } }}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring text-sm"
              />
              <Button variant="secondary" onClick={() => addTag('specialties', specInput)} type="button" size="sm">Ajouter</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Technologies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.technologies.length === 0 && (
                <span className="text-xs text-gray-400 italic px-1">Ajoutez vos technologies préférées</span>
              )}
              {form.technologies.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 text-sm font-medium">
                  {t}
                  <button onClick={() => removeTag('technologies', t)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Ex: React, Node.js..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('technologies', techInput); } }}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring text-sm"
              />
              <Button variant="secondary" onClick={() => addTag('technologies', techInput)} type="button" size="sm">Ajouter</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Links & Social */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3 mb-5">
          Liens & Réseaux
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Site web"
            value={form.website}
            onChange={(e) => updateField('website', e.target.value)}
            icon={<Globe className="h-4 w-4" />}
            placeholder="https://masociete.com"
          />
          <Input
            label="GitHub"
            value={form.github}
            onChange={(e) => updateField('github', e.target.value)}
            icon={<Code2 className="h-4 w-4" />}
            placeholder="https://github.com/votre-profil"
          />
          <Input
            label="LinkedIn"
            value={form.linkedin}
            onChange={(e) => updateField('linkedin', e.target.value)}
            icon={<ExternalLink className="h-4 w-4" />}
            placeholder="https://linkedin.com/in/votre-profil"
          />
          <Input
            label="Portfolio"
            value={form.portfolio}
            onChange={(e) => updateField('portfolio', e.target.value)}
            icon={<Briefcase className="h-4 w-4" />}
            placeholder="https://votre-portfolio.com"
          />
        </div>
      </Card>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => refetch()} disabled={updateProfile.isPending}>
          Réinitialiser
        </Button>
        <Button
          onClick={handleSave}
          variant="gradient"
          isLoading={updateProfile.isPending}
        >
          <Save className="h-4 w-4" />
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
