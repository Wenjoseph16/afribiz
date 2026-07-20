'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  Image,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Camera,
  Share2,
  ExternalLink,
  Play,
  Save,
  Eye,
  Plus,
  Loader2,
  Palette,
  Trash2,
  ShoppingBag,
  Hand,
  UtensilsCrossed,
  Calendar,
  Car,
  HelpCircle,
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';
import { useBusinessStore } from '@/stores/businessStore';
import { FaqSection } from '@/components/dashboard/FaqSection';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { LiveVisitorCounter } from '@/components/business-public/LiveVisitorCounter';

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
  const { addToast } = useToast();

  const { business, setBusiness } = useBusinessStore();
  const [activeTab, setActiveTab] = useState('identity');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Initialize hours from business data or defaults
  const [hours, setHours] = useState<
    { key: DayKey; open: string; close: string; closed: boolean }[]
  >(() => {
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

  const updateForm = useCallback(
    (field: string, value: any) => {
      if (!business) return;
      setBusiness({ ...business, [field]: value });
    },
    [business, setBusiness]
  );

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
        hours: hours.map((h) => ({
          day: h.key,
          open: h.open,
          close: h.close,
          isClosed: h.closed,
        })),
        theme,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Une erreur est survenue lors de la sauvegarde';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }, [business, hours, savePublicPage]);

  // Theme state with extended options
  const [theme, setTheme] = useState<{
    primaryColor: string;
    backgroundColor: string;
    borderRadius: string;
    fontFamily: string;
    enableAnimations: boolean;
    layout: string;
    sectionVisibility: Record<string, boolean>;
  }>(() => {
    const saved = (business as unknown as Record<string, unknown>)?.theme;
    const defaultTheme = {
      primaryColor: '#059669',
      backgroundColor: '#ffffff',
      borderRadius: 'xl',
      fontFamily: 'inter',
      enableAnimations: true,
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
    } as const;
    if (saved && typeof saved === 'object' && 'primaryColor' in saved) {
      return { ...defaultTheme, ...(saved as Record<string, unknown>) } as {
        primaryColor: string;
        backgroundColor: string;
        borderRadius: string;
        fontFamily: string;
        enableAnimations: boolean;
        layout: string;
        sectionVisibility: Record<string, boolean>;
      };
    }
    return defaultTheme as {
      primaryColor: string;
      backgroundColor: string;
      borderRadius: string;
      fontFamily: string;
      enableAnimations: boolean;
      layout: string;
      sectionVisibility: Record<string, boolean>;
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
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
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
                      value={(business as unknown as Record<string, string>)?.tagline || ''}
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
                        <NextImage
                          src={business.logo}
                          alt="logo"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <Image className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setSaving(true);
                              const res = await apiClient.uploadMedia(file);
                              if (res.data?.data?.url) updateForm('logo', res.data.data.url);
                              addToast({
                                title: 'Logo téléchargé avec succès',
                                variant: 'success',
                              });
                            } catch (err) {
                              addToast({
                                title: 'Erreur lors du téléchargement du logo',
                                variant: 'error',
                              });
                            } finally {
                              setSaving(false);
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-1.5" />
                        Changer le logo
                      </Button>
                      <p className="text-[10px] text-gray-400">PNG, JPG ou SVG. Max 2Mo.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image de couverture
                  </label>
                  <div className="relative aspect-[3/1] max-h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700">
                    {business?.coverImage ? (
                      <NextImage
                        src={business.coverImage}
                        alt="cover"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="text-center">
                        <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Image de couverture recommandée</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => document.getElementById('cover-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-1.5" /> Modifier
                      </Button>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="cover-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setSaving(true);
                          const res = await apiClient.uploadMedia(file);
                          if (res.data?.data?.url) updateForm('coverImage', res.data.data.url);
                          addToast({
                            title: 'Image de couverture mise à jour',
                            variant: 'success',
                          });
                        } catch (err) {
                          addToast({ title: 'Erreur lors du téléchargement', variant: 'error' });
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Format recommandé : 1200x400px. Max 5Mo.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Galerie photos
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {(business as unknown as Record<string, string[]>)?.gallery?.map(
                      (url: string, i: number) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-xl overflow-hidden group"
                        >
                          <NextImage src={url} alt={`gallery-${i}`} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => {
                                let newGallery = (
                                  business as unknown as Record<string, string[]>
                                ).gallery.filter((_: string, idx: number) => idx !== i);
                                updateForm('gallery', newGallery);
                              }}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                    <div
                      onClick={() => document.getElementById('gallery-upload')?.click()}
                      className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-brand transition-colors"
                    >
                      <Plus className="h-6 w-6 text-gray-300" />
                    </div>
                  </div>
                  <input
                    type="file"
                    id="gallery-upload"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        try {
                          setSaving(true);
                          const res = await apiClient.uploadMultipleMedia(files);
                          const newUrls =
                            (res.data?.data as Array<{ url: string }>)?.map((f: any) => f.url) ||
                            [];
                          const currentGallery =
                            (business as unknown as Record<string, string[]>)?.gallery || [];
                          updateForm('gallery', [...currentGallery, ...newUrls]);
                          addToast({
                            title: `${files.length} photo(s) ajoutée(s)`,
                            variant: 'success',
                          });
                        } catch (err) {
                          addToast({
                            title: "Erreur lors de l'envoi des photos",
                            variant: 'error',
                          });
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Vous pouvez ajouter jusqu&apos;à 10 photos. Max 5Mo par photo.
                  </p>
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
                  value={(business as unknown as Record<string, string>)?.googleMapsLink || ''}
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
                  <div
                    key={day.key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-24 shrink-0">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          day.closed ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                        )}
                      >
                        {DAYS.find((d) => d.key === day.key)?.label}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.closed}
                        onChange={() =>
                          setHours((prev) =>
                            prev.map((h) => (h.key === day.key ? { ...h, closed: !h.closed } : h))
                          )
                        }
                        className="rounded border-gray-300 text-brand focus:ring-brand/20"
                      />
                      <span className="text-xs text-gray-500">Fermé</span>
                    </label>
                    {!day.closed && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((h) =>
                                h.key === day.key ? { ...h, open: e.target.value } : h
                              )
                            )
                          }
                          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                        <span className="text-gray-400 text-sm">à</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) =>
                            setHours((prev) =>
                              prev.map((h) =>
                                h.key === day.key ? { ...h, close: e.target.value } : h
                              )
                            )
                          }
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
                  {
                    label: 'LinkedIn',
                    icon: ExternalLink,
                    placeholder: 'https://linkedin.com/...',
                  },
                  {
                    label: 'Twitter / X',
                    icon: MessageCircle,
                    placeholder: 'https://twitter.com/...',
                  },
                  { label: 'YouTube', icon: Play, placeholder: 'https://youtube.com/...' },
                ].map((social) => (
                  <div key={social.label} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400">
                      <social.icon className="h-4 w-4" />
                    </div>
                    <Input
                      label={social.label}
                      value={
                        (business as unknown as Record<string, Record<string, string>>)
                          ?.socialLinks?.[social.label.toLowerCase()] || ''
                      }
                      onChange={(e: any) => {
                        const links = {
                          ...(business as unknown as Record<string, Record<string, string>>)
                            ?.socialLinks,
                          [social.label.toLowerCase()]: e.target.value,
                        };
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur principale
                    </label>
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
                    {[
                      '#059669',
                      '#6366f1',
                      '#f59e0b',
                      '#ef4444',
                      '#ec4899',
                      '#06b6d4',
                      '#84cc16',
                      '#f97316',
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setTheme({ ...theme, primaryColor: color })}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          theme.primaryColor === color
                            ? 'border-gray-900 dark:border-white scale-110'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="Couleur de fond">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Fond de la page
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={theme.backgroundColor}
                        onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.backgroundColor}
                        onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#0f172a', '#1e293b'].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setTheme({ ...theme, backgroundColor: color })}
                            className={cn(
                              'w-7 h-7 rounded-full border-2 transition-all',
                              theme.backgroundColor === color
                                ? 'border-gray-900 dark:border-white scale-110'
                                : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Apparence">
                <div className="space-y-4">
                  {/* Border radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Coins arrondis
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'sm', label: 'Fin', class: 'rounded-sm' },
                        { value: 'md', label: 'Moyen', class: 'rounded-lg' },
                        { value: 'xl', label: 'Arrondi', class: 'rounded-xl' },
                        { value: '2xl', label: 'Très arrondi', class: 'rounded-2xl' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTheme({ ...theme, borderRadius: opt.value })}
                          className={cn(
                            'p-3 rounded-xl border-2 text-center transition-all',
                            theme.borderRadius === opt.value
                              ? 'border-brand bg-brand-50 dark:bg-brand-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          )}
                        >
                          <div
                            className={cn(
                              'w-full h-6 bg-gray-200 dark:bg-gray-600 mx-auto mb-1',
                              opt.class
                            )}
                          />
                          <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            {opt.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Police */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Police d&apos;écriture
                    </label>
                    <Select
                      value={theme.fontFamily}
                      onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                      options={[
                        { value: 'inter', label: 'Inter (Moderne)' },
                        { value: 'geist', label: 'Geist (Design)' },
                        { value: 'system', label: 'Système (Par défaut)' },
                      ]}
                    />
                  </div>

                  {/* Animations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Animations
                    </label>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Animations au scroll
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Activer les apparitions animées des sections
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setTheme({ ...theme, enableAnimations: !theme.enableAnimations })
                        }
                        className={cn(
                          'relative w-10 h-6 rounded-full transition-colors shrink-0',
                          theme.enableAnimations ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            theme.enableAnimations ? 'left-5' : 'left-1'
                          )}
                        />
                      </button>
                    </div>
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
                      <div className="w-full h-8 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center gap-1 px-2">
                        <div className="w-1.5 h-4 bg-brand rounded-sm" />
                        <div className="w-1.5 h-3 bg-gray-300 dark:bg-gray-500 rounded-sm" />
                        <div className="w-1.5 h-2 bg-gray-300 dark:bg-gray-500 rounded-sm" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Visibilité des sections">
                <p className="text-xs text-gray-500 mb-4">
                  Choisissez les sections à afficher sur votre page publique
                </p>
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
                          <div
                            className={cn(
                              'p-1.5 rounded-lg',
                              visible ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-sm font-medium',
                                visible ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                              )}
                            >
                              {section.label}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {visible ? 'Visible sur la page publique' : 'Masqué'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setTheme({
                              ...theme,
                              sectionVisibility: {
                                ...theme.sectionVisibility,
                                [section.key]: !visible,
                              },
                            })
                          }
                          className={cn(
                            'relative w-10 h-6 rounded-full transition-colors shrink-0',
                            visible ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                              visible ? 'left-5' : 'left-1'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && <FaqSection />}

          {/* SEO */}
          {activeTab === 'seo' && (
            <Card title="Référencement (SEO)">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Meta titre"
                    value={
                      (business as unknown as Record<string, string>)?.seoTitle ||
                      business?.name ||
                      ''
                    }
                    onChange={(e: any) => updateForm('seoTitle', e.target.value)}
                    placeholder="Titre affiché dans les résultats de recherche"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={cn(
                        'text-[10px]',
                        (
                          (business as unknown as Record<string, string>)?.seoTitle ||
                          business?.name ||
                          ''
                        ).length > 60
                          ? 'text-red-500'
                          : 'text-gray-400'
                      )}
                    >
                      {
                        (
                          (business as unknown as Record<string, string>)?.seoTitle ||
                          business?.name ||
                          ''
                        ).length
                      }
                      /60 caractères
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Meta description
                  </label>
                  <textarea
                    value={
                      (business as unknown as Record<string, string>)?.seoDescription ||
                      business?.description ||
                      ''
                    }
                    onChange={(e) => updateForm('seoDescription', e.target.value)}
                    placeholder="Description affichée dans les résultats de recherche"
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={cn(
                        'text-[10px]',
                        (
                          (business as unknown as Record<string, string>)?.seoDescription ||
                          business?.description ||
                          ''
                        ).length > 160
                          ? 'text-red-500'
                          : 'text-gray-400'
                      )}
                    >
                      {
                        (
                          (business as unknown as Record<string, string>)?.seoDescription ||
                          business?.description ||
                          ''
                        ).length
                      }
                      /160 caractères
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
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Aperçu recherche Google
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium truncate">
                      {(business as unknown as Record<string, string>)?.seoTitle ||
                        business?.name ||
                        'Titre de votre page'}{' '}
                      | AfriBiz
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 truncate">
                      https://afribiz.ci/business/{business?.slug || 'votre-slug'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {(business as unknown as Record<string, string>)?.seoDescription ||
                        business?.description ||
                        'Description de votre business...'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>💡 Astuce :</strong> Un bon titre SEO fait moins de 60 caractères et
                    contient votre mot-clé principal. La description doit être entre 120 et 160
                    caractères.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Live preview sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Stats en direct */}
            {business?.slug && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                  </span>
                  Statistiques en direct
                </h3>
                <LiveVisitorCounter slug={business.slug} variant="inline" />
              </Card>
            )}

            {/* Aperçu en direct */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Aperçu en direct
              </h3>
              <div className="aspect-[9/16] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* Cover + Bannière */}
                <div
                  className="h-12 relative overflow-hidden"
                  style={{
                    backgroundColor: theme.primaryColor || '#059669',
                  }}
                >
                  {business?.coverImage && (
                    <NextImage
                      src={business.coverImage}
                      alt=""
                      fill
                      className="object-cover opacity-40"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="px-3 pb-3 -mt-6">
                  {/* Logo */}
                  <div className="relative z-10 mb-2">
                    <div className="w-10 h-10 rounded-xl border-2 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow overflow-hidden">
                      {business?.logo ? (
                        <NextImage
                          src={business.logo}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand font-bold text-sm">
                          {business?.name?.charAt(0) || 'B'}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Nom + Type */}
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {business?.name || 'Nom du business'}
                  </p>
                  {business?.type && (
                    <p className="text-[9px] text-brand font-medium truncate">
                      {business.type.replace(/_/g, ' ')}
                    </p>
                  )}
                  {/* Description */}
                  {business?.description && (
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-tight">
                      {business.description}
                    </p>
                  )}
                  {/* Infos */}
                  <div className="mt-2 space-y-1 text-[9px] text-gray-400">
                    {business?.phone && <p>📞 {business.phone}</p>}
                    {business?.address && <p>📍 {business.address}</p>}
                    {business?.whatsapp && (
                      <p className="text-emerald-600">💬 {business.whatsapp}</p>
                    )}
                    {(business?.rating ?? 0) > 0 && (
                      <p>
                        ⭐ {(business?.rating ?? 0).toFixed(1)} ({business?.reviewCount ?? 0} avis)
                      </p>
                    )}
                  </div>
                  {/* Actions simulées */}
                  <div className="flex gap-1 mt-2">
                    <div
                      className="flex-1 h-4 rounded-full text-white text-[7px] font-medium flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryColor || '#059669' }}
                    >
                      {business?.whatsapp ? 'WhatsApp' : 'Contacter'}
                    </div>
                    <div className="flex-1 h-4 rounded-full bg-gray-100 dark:bg-gray-700 text-[7px] font-medium flex items-center justify-center text-gray-500">
                      Commander
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicateur de complétion */}
              {(() => {
                const completionItems = [
                  business?.logo,
                  business?.coverImage,
                  business?.description,
                  business?.phone,
                  business?.address,
                  business?.whatsapp,
                  (business?.hours?.length ?? 0) > 0,
                ];
                const completedCount = completionItems.filter(Boolean).length;
                const percentage = completedCount * 14;
                const missingCount = 7 - completedCount;
                return (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-medium">
                        Complétion du profil
                      </span>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: theme.primaryColor || '#059669' }}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: theme.primaryColor || '#059669',
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400">
                      {missingCount} élément{missingCount !== 1 ? 's' : ''} manquant
                      {missingCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="mt-3"
                onClick={() => business?.slug && router.push(`/business/${business.slug}`)}
              >
                <Eye className="h-4 w-4" />
                Ouvrir la page publique
              </Button>
            </Card>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
              </div>
            )}
            <Button variant="gradient" size="lg" fullWidth onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
