'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, Download, Calendar, User, Package, Tag, Shield,
  ChevronLeft, Clock, CheckCircle, AlertCircle, ShoppingCart,
  Sparkles, Eye, Code, Loader as LoaderIcon,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">({count})</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PricingSection({ module: mod, onInstall, installing }: { module: any; onInstall: () => void; installing: boolean }) {
  const isFree = mod.pricingType === 'FREE' || mod.isFree;
  const price = Number(mod.price) || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prix</h3>
      <div className="mb-6">
        {isFree ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
            <span className="text-3xl font-bold text-emerald-600">Gratuit</span>
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{price.toLocaleString()}</span>
            <span className="text-lg text-gray-500">FCFA</span>
          </div>
        )}
      </div>

      <button
        onClick={onInstall}
        disabled={installing}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {installing ? <LoaderIcon size={18} className="animate-spin" /> : <Download size={18} />}
        {installing ? 'Installation...' : 'Installer le module'}
      </button>

      <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">
        <Eye size={16} />
        Voir la démo
      </button>

      {mod.features && mod.features.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Fonctionnalités</h4>
          <div className="space-y-2">
            {mod.features.slice(0, 8).map((f: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-xs text-gray-600">{f}</span>
              </div>
            ))}
            {mod.features.length > 8 && (
              <p className="text-xs text-gray-400 italic">+{mod.features.length - 8} autres</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoSection({ module: mod }: { module: any }) {
  const dev = mod.developer;
  const devName = dev?.companyName || (dev?.user ? `${dev.user.firstName} ${dev.user.lastName}` : 'Développeur');

  const infos = [
    { icon: <User size={16} className="text-indigo-600" />, label: 'Développeur', value: devName, bg: 'bg-indigo-50' },
    { icon: <Tag size={16} className="text-amber-600" />, label: 'Catégorie', value: mod.category || '-', bg: 'bg-amber-50' },
    { icon: <Package size={16} className="text-blue-600" />, label: 'Version', value: `v${mod.version}`, bg: 'bg-blue-50' },
    { icon: <Download size={16} className="text-purple-600" />, label: 'Installations', value: (mod.totalInstalls || 0).toLocaleString(), bg: 'bg-purple-50' },
    { icon: <Calendar size={16} className="text-cyan-600" />, label: 'Publié le', value: mod.publishedAt ? new Date(mod.publishedAt).toLocaleDateString('fr-FR') : '-', bg: 'bg-cyan-50' },
    { icon: <Clock size={16} className="text-gray-600" />, label: 'Dernière mise à jour', value: mod.updatedAt ? new Date(mod.updatedAt).toLocaleDateString('fr-FR') : '-', bg: 'bg-gray-50' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
      <div className="space-y-3">
        {infos.map((info, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', info.bg)}>
              {info.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{info.label}</p>
              <p className="text-sm font-medium text-gray-900">{info.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModuleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [installError, setInstallError] = useState('');

  const installMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const res = await apiClient.post(`/developer/marketplace/modules/${moduleId}/install`);
      return res.data;
    },
    onSuccess: () => {
      setInstallError('');
      queryClient.invalidateQueries({ queryKey: ['marketplace-module', slug] });
    },
    onError: (err: any) => {
      setInstallError(err?.response?.data?.error || err?.message || 'Erreur lors de l\'installation');
    },
  });

  const handleInstall = () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (mod?.id) installMutation.mutate(mod.id);
  };

  const { data: module, isLoading, error } = useQuery({
    queryKey: ['marketplace-module', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug manquant');
      const res = await apiClient.getMarketplaceModule(slug);
      return res.data.data;
    },
    enabled: !!slug,
  });

  const mod = module;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-72 bg-gradient-to-br from-gray-200 to-gray-300" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-white rounded-2xl" />
                <div className="h-48 bg-white rounded-2xl" />
              </div>
              <div className="space-y-6">
                <div className="h-52 bg-white rounded-2xl" />
                <div className="h-72 bg-white rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Module introuvable</h2>
          <p className="text-gray-500 mb-6">Ce module n&apos;existe pas ou a été retiré du marketplace.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft size={18} />
            Retour au marketplace
          </Link>
        </div>
      </div>
    );
  }

  const dev = mod.developer;
  const devName = dev?.companyName || (dev?.user ? `${dev.user.firstName} ${dev.user.lastName}` : 'Développeur');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Retour au marketplace
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {mod.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                    <Tag size={12} />
                    {mod.category}
                  </span>
                )}
                {mod.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                    <Shield size={12} />
                    Vérifié
                  </span>
                )}
                {mod.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-500/30">
                    <Sparkles size={12} />
                    En vedette
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                {mod.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80">
                <div className="flex items-center gap-2">
                  <Code size={16} />
                  <span className="font-medium">{devName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={16} />
                  <span>v{mod.version}</span>
                </div>
                <StarRating rating={mod.rating || 0} count={mod.reviewCount || 0} />
                <div className="flex items-center gap-2">
                  <Download size={16} />
                  <span>{(mod.totalInstalls || 0).toLocaleString()} installations</span>
                </div>
              </div>
              {mod.description && (
                <p className="mt-4 text-white/70 text-sm max-w-2xl line-clamp-2">{mod.description}</p>
              )}
            </div>

            {mod.logo && (
              <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-1.5 shadow-lg relative">
                    <Image src={mod.logo ?? ''} alt={mod.name} fill className="rounded-xl object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={<Download className="h-4 w-4 text-indigo-600" />} label="Installations" value={(mod.totalInstalls || 0).toLocaleString()} />
              <StatCard icon={<Star className="h-4 w-4 text-amber-500 fill-amber-500" />} label="Note moyenne" value={(mod.rating || 0).toFixed(1)} />
              <StatCard icon={<ShoppingCart className="h-4 w-4 text-emerald-600" />} label="Ventes" value={(mod.totalSales || 0).toLocaleString()} />
            </div>

            {/* Full Description */}
            {mod.fullDescription && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description détaillée</h2>
                <div className="prose prose-gray max-w-none text-gray-600">
                  <p className="text-base leading-relaxed whitespace-pre-line">{mod.fullDescription}</p>
                </div>
              </div>
            )}

            {/* Features */}
            {mod.features && mod.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fonctionnalités</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mod.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images Gallery */}
            {mod.images && mod.images.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Captures d&apos;écran</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mod.images.map((img: string, i: number) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative group">
                      <Image
                        src={img ?? ''}
                        alt={`${mod.name} screenshot ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Setup Guide */}
            {mod.setupGuide && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Guide d&apos;installation</h2>
                <div className="prose prose-gray max-w-none text-gray-600">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{mod.setupGuide}</p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {mod.requirements && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Prérequis</h2>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">{mod.requirements}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PricingSection module={mod} onInstall={handleInstall} installing={installMutation.isPending} />
            {installError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {installError}
              </div>
            )}
            <InfoSection module={mod} />
          </div>
        </div>
      </div>
    </div>
  );
}
