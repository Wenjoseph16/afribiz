'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Image, MapPin, Phone, Mail, MessageCircle, Clock,
  Camera, Share2, ExternalLink, Play, Save,
  Eye, Plus, Loader2, Palette,
  ShoppingBag, Hand, UtensilsCrossed, Calendar, Car,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export default function PublicPageManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { business, setBusiness } = useBusinessStore();
  const [activeTab, setActiveTab] = useState('identity');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Initialize hours from business data or defaults
  const [hours, setHours] = useState<{ key: DayKey; open: string; close: string; closed: boolean }[]>(() => {
    const bizHours = business?.hours || [];
    return DAYS.map((d, idx) => {
      const existing = bizHours.find((h) => h.day === idx);
      return {
        key: d.key,
        open: existing?.open || '08:00',
        close: existing?.close || '18:00',
        closed: existing?.isClosed ?? d.key === 'sunday',
      };
    });
  });

  const { data: preview } = useQuery({
    queryKey: ['publicPagePreview'],
    queryFn: () => apiClient.getPublicPagePreview(),
    enabled: false,
  });

  const updateForm = useCallback((field: string, value: any) => {
    if (!business) return;
    setBusiness({ ...business, [field]: value });
  }, [business, setBusiness]);

  const savePublicPage = useMutation({
    mutationFn: (data: any) => apiClient.updatePublicPage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await savePublicPage.mutateAsync({
        ...business,
        hours: hours.filter((h) => !h.closed).map((h) => ({
          day: h.key,
          open: h.open,
          close: h.close,
        })),
        theme,
      });
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Une erreur est survenue lors de la sauvegarde';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [business, hours, savePublicPage]);

  // Theme state
  const [theme, setTheme] = useState<{
    primaryColor: string;
    layout: string;
    sectionVisibility: Record<string, boolean>;
  }>(() => {
    const saved = (business as any)?.theme;
    return saved || {
      primaryColor: '#059669',
      layout: 'standard',
      sectionVisibility: {
        products: true,
        services: true,
        menu: true,
        events: true,
        rentals: true,
        gallery: true,
        reviews: true,
      },
    };
  });

  const SECTION_CONFIG = [
    { key: 'products', label: 'Produits', icon: ShoppingBag },
    { key: 'services', label: 'Services', icon: Hand },
    { key: 'menu', label: 'Menu / Carte', icon: UtensilsCrossed },
    { key: 'events', label: 'Événements', icon: Calendar },
    { key: 'rentals', label: 'Locations', icon: Car },
    { key: 'gallery', label: 'Galerie', icon: Image },
    { key: 'reviews', label: 'Avis', icon: Eye },
  ];

  const tabs = [
    { id: 'identity', label: 'Identité', icon: Globe },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'hours', label: 'Horaires', icon: Clock },
    { id: 'social', label: 'Réseaux', icon: Share2 },
    { id: 'theme', label: 'Thème', icon: Palette },
    { id: 'seo', label: 'SEO', icon: Eye },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Page publique"
        description="Personnalisez votre page publique visible par les visiteurs"
        gradient
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          {activeTab === 'identity' && (
            <Card title="Identité de votre business">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      label="Nom du business"
                      value={business?.name || ''}
                      onChange={(e: any) => updateForm('name', e.target.value)}
                      placeholder="Ex: Restaurant Chez Maman"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Slogan"
                      value={(business as any)?.tagline || ''}
                      onChange={(e: any) => updateForm('tagline', e.target.value)}
                      placeholder="Ex: La cuisine qui réchauffe le coeur"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={business?.description || ''}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Décrivez votre business en quelques phrases..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                  />
                </div>
                <Input
                  label="Catégorie"
                  value={business?.type?.replace(/_/g, ' ') || ''}
                  disabled
                  helperText="La catégorie est définie lors de la création"
                />
              </div>
            </Card>
          )}

          {/* Photos */}
          {activeTab === 'photos' && (
            <Card title="Photos & médias">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 relative">
                      {business?.logo ? (
                        <NextImage src={business.logo} alt="logo" fill className="object-cover" sizes="80px" unoptimized />
                      ) : (
                        <Image className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Changer le logo
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image de couverture
                  </label>
                  <div className="aspect-[3/1] max-h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 relative">
                    {business?.coverImage ? (
                      <NextImage src={business.coverImage} alt="cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                    ) : (
                      <div className="text-center">
                        <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Cliquez pour ajouter une couverture</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Galerie photos
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-brand transition-colors">
                        <Plus className="h-6 w-6 text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Contact */}
          {activeTab === 'contact' && (
            <Card title="Informations de contact">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone"
                    value={business?.phone || ''}
                    onChange={(e: any) => updateForm('phone', e.target.value)}
                    placeholder="+225 01 XX XX XX XX"
                    icon={<Phone className="h-4 w-4" />}
                  />
                  <Input
                    label="Email"
                    value={business?.email || ''}
                    onChange={(e: any) => updateForm('email', e.target.value)}
                    placeholder="contact@example.com"
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="WhatsApp"
                    value={business?.whatsapp || ''}
                    onChange={(e: any) => updateForm('whatsapp', e.target.value)}
                    placeholder="+225 01 XX XX XX XX"
                    icon={<MessageCircle className="h-4 w-4" />}
                  />
                  <Input
                    label="Adresse"
                    value={business?.address || ''}
                    onChange={(e: any) => updateForm('address', e.target.value)}
                    placeholder="Abidjan, Cocody"
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </div>
                <Input
                  label="Lien Google Maps"
                  value={(business as any)?.googleMapsLink || ''}
                  onChange={(e: any) => updateForm('googleMapsLink', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </Card>
          )}

          {/* Hours */}
          {activeTab === 'hours' && (
            <Card title="Horaires d'ouverture">
              <div className="space-y-2">
                {hours.map((day) => (
                  <div key={day.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className="w-24 shrink-0">
                      <span className={cn('text-sm font-medium', day.closed ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100')}>
                        {DAYS.find((d) => d.key === day.key)?.label}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.closed}
                        onChange={() => setHours((prev) => prev.map((h) => h.key === day.key ? { ...h, closed: !h.closed } : h))}
                        className="rounded border-gray-300 text-brand focus:ring-brand/20"
                      />
                      <span className="text-xs text-gray-500">Fermé</span>
                    </label>
                    {!day.closed && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => setHours((prev) => prev.map((h) => h.key === day.key ? { ...h, open: e.target.value } : h))}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                        <span className="text-gray-400 text-sm">à</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => setHours((prev) => prev.map((h) => h.key === day.key ? { ...h, close: e.target.value } : h))}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Social */}
          {activeTab === 'social' && (
            <Card title="Réseaux sociaux">
              <div className="space-y-4">
                {[
                  { label: 'Instagram', icon: Camera, placeholder: 'https://instagram.com/...' },
                  { label: 'Facebook', icon: Share2, placeholder: 'https://facebook.com/...' },
                  { label: 'LinkedIn', icon: ExternalLink, placeholder: 'https://linkedin.com/...' },
                  { label: 'Twitter / X', icon: MessageCircle, placeholder: 'https://twitter.com/...' },
                  { label: 'YouTube', icon: Play, placeholder: 'https://youtube.com/...' },
                ].map((social) => (
                  <div key={social.label} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400">
                      <social.icon className="h-4 w-4" />
                    </div>
                    <Input
                      label={social.label}
                      value={(business as any)?.socialLinks?.[social.label.toLowerCase()] || ''}
                      onChange={(e: any) => {
                        const links = { ...(business as any)?.socialLinks, [social.label.toLowerCase()]: e.target.value };
                        updateForm('socialLinks', links);
                      }}
                      placeholder={social.placeholder}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Theme */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <Card title="Couleurs">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur principale</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                      <div
                        className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['#059669', '#6366f1', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setTheme({ ...theme, primaryColor: color })}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          theme.primaryColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Disposition">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'standard', label: 'Standard', desc: 'Disposition classique' },
                    { value: 'compact', label: 'Compact', desc: 'Plus dense' },
                    { value: 'elegant', label: 'Élégant', desc: 'Plus aéré' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme({ ...theme, layout: opt.value })}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all',
                        theme.layout === opt.value
                          ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      )}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Visibilité des sections">
                <p className="text-xs text-gray-500 mb-4">Choisissez les sections à afficher sur votre page publique</p>
                <div className="space-y-2">
                  {SECTION_CONFIG.map((section) => {
                    const visible = theme.sectionVisibility[section.key] !== false;
                    const Icon = section.icon;
                    return (
                      <div
                        key={section.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-1.5 rounded-lg', visible ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={cn('text-sm font-medium', visible ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
                              {section.label}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {visible ? 'Visible sur la page publique' : 'Masqué'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setTheme({
                            ...theme,
                            sectionVisibility: {
                              ...theme.sectionVisibility,
                              [section.key]: !visible,
                            },
                          })}
                          className={cn(
                            'relative w-10 h-6 rounded-full transition-colors shrink-0',
                            visible ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                          )}
                        >
                          <div className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            visible ? 'left-5' : 'left-1'
                          )} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* SEO */}
          {activeTab === 'seo' && (
            <Card title="Référencement (SEO)">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Meta titre"
                    value={(business as any)?.seoTitle || business?.name || ''}
                    onChange={(e: any) => updateForm('seoTitle', e.target.value)}
                    placeholder="Titre affiché dans les résultats de recherche"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={cn('text-[10px]', ((business as any)?.seoTitle || business?.name || '').length > 60 ? 'text-red-500' : 'text-gray-400')}>
                      {((business as any)?.seoTitle || business?.name || '').length}/60 caractères
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Meta description
                  </label>
                  <textarea
                    value={(business as any)?.seoDescription || business?.description || ''}
                    onChange={(e) => updateForm('seoDescription', e.target.value)}
                    placeholder="Description affichée dans les résultats de recherche"
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={cn('text-[10px]', ((business as any)?.seoDescription || business?.description || '').length > 160 ? 'text-red-500' : 'text-gray-400')}>
                      {((business as any)?.seoDescription || business?.description || '').length}/160 caractères
                    </span>
                  </div>
                </div>
                <Input
                  label="URL personnalisée (slug)"
                  value={business?.slug || ''}
                  onChange={(e: any) => updateForm('slug', e.target.value)}
                  placeholder="mon-business"
                  helperText="Ex: afribiz.ci/mon-business"
                />

                {/* Google Preview */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aperçu recherche Google</p>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium truncate">
                      {(business as any)?.seoTitle || business?.name || 'Titre de votre page'} | AfriBiz
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 truncate">
                      https://afribiz.ci/business/{business?.slug || 'votre-slug'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {(business as any)?.seoDescription || business?.description || 'Description de votre business...'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>💡 Astuce :</strong> Un bon titre SEO fait moins de 60 caractères et contient votre mot-clé principal. La description doit être entre 120 et 160 caractères.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Live preview sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Aperçu en direct
              </h3>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="h-3 bg-gradient-to-r from-brand to-emerald-400" />
                <div className="p-3 space-y-2">
                  {business?.logo && (
                    <NextImage src={business.logo} alt="" width={40} height={40} className="rounded-lg object-cover" unoptimized />
                  )}
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {business?.name || 'Nom du business'}
                  </p>
                  {business?.description && (
                    <p className="text-[10px] text-gray-500 line-clamp-2">{business.description}</p>
                  )}
                  {business?.phone && (
                    <p className="text-[10px] text-gray-400">📞 {business.phone}</p>
                  )}
                  {business?.address && (
                    <p className="text-[10px] text-gray-400">📍 {business.address}</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" fullWidth className="mt-3" onClick={() => business?.slug && router.push(`/business/${business.slug}`)}>
                <Eye className="h-4 w-4" />
                Ouvrir la page publique
              </Button>
            </Card>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              </div>
            )}
            <Button
              variant="gradient"
              size="lg"
              fullWidth
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
