'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Package, Star, Download, ShoppingCart, Heart,
  Share2, ChevronDown, Check, Users,
  FileText, MessageCircle, Shield,
  Code, ExternalLink, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { useMarketplaceModule, useInstallMarketplaceModule } from '@/features/developerHooks';

export default function MarketplaceModuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { data: mod, isLoading } = useMarketplaceModule(slug);
  const installMutation = useInstallMarketplaceModule();
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'faq'>('description');
  const [isFavorited, setIsFavorited] = useState(false);

  const isFree = mod?.pricingType === 'FREE' || !mod?.price || mod?.isFree;

  const handleInstall = async () => {
    if (!mod?.id) return;
    if (!isFree) {
      router.push(`/dashboard/marketplace/${slug}/checkout`);
      return;
    }
    await installMutation.mutateAsync(mod.id);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn('h-3.5 w-3.5', i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600')} />
    ));
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (!mod) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in flex flex-col items-center justify-center py-20">
        <Package className="h-16 w-16 text-gray-200 dark:text-gray-700 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Module introuvable</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Le module que vous recherchez n&apos;existe pas ou a été retiré.</p>
        <Link href="/dashboard/marketplace"><Button variant="secondary" className="mt-4">Retour à la marketplace</Button></Link>
      </div>
    );
  }

  const devName = mod.developer?.developerName || mod.developer?.name || 'Développeur';
  const reviewCount = mod.reviewCount || (mod.reviews?.length || 0);
  const faqs = mod.faqs || [];
  const features = mod.features || [];
  const requirements = mod.requirements || [];
  const reviews = mod.reviews || [];
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour à la marketplace
      </button>

      {/* Module Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-brand-900/20 dark:via-gray-800 dark:to-purple-900/20 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-brand/20 shrink-0 mx-auto lg:mx-0 overflow-hidden">
              {mod.logo ? (
                <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : (
                <Package className="h-10 w-10" />
              )}
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{mod.name}</h1>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-brand-50 text-brand dark:bg-brand-900/30 dark:text-brand-300 rounded-full border border-brand/20">
                    v{mod.version || '1.0.0'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {mod.category}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-4">{mod.shortDescription || mod.tagline}</p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-1 text-amber-500">
                  {renderStars(mod.rating || 0)}
                  <span className="font-semibold text-gray-900 dark:text-gray-100 ml-1">{mod.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400">({reviewCount} avis)</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Download className="h-4 w-4" />
                  <span>{mod.totalInstalls || 0} installations</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{devName}</span>
                  {(mod.developer as any)?.verified && <Shield className="h-3.5 w-3.5 text-brand" />}
                </div>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-4 lg:min-w-[200px]">
              <div className="text-center lg:text-right">
                <p className="text-3xl font-black text-gray-900 dark:text-gray-100">
                  {isFree ? 'Gratuit' : `${mod.price?.toLocaleString()} FCFA`}
                </p>
                <p className="text-xs text-gray-500">
                  {isFree ? 'Gratuit' : mod.pricingType === 'ONE_TIME' ? 'Paiement unique' : 'Abonnement'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="lg" onClick={handleInstall} isLoading={installMutation.isPending}>
                  {installMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFree ? <Download className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  {installMutation.isPending ? 'Installation...' : isFree ? 'Installer' : `Acheter ${mod.price?.toLocaleString()} FCFA`}
                </Button>
                <button onClick={() => setIsFavorited(!isFavorited)}
                  className={cn('p-3 rounded-xl border transition-all', isFavorited ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300')}>
                  <Heart className={cn('h-5 w-5', isFavorited && 'fill-red-500')} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
            {(['description', 'reviews', 'faq'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}>
                {tab === 'description' ? 'Description' : tab === 'reviews' ? `Avis (${reviewCount})` : 'FAQ'}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <>
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">À propos</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{mod.fullDescription || mod.shortDescription || mod.description}</div>
              </Card>

              {features.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Fonctionnalités</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feat: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feat.name || feat}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {requirements.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Prérequis techniques</h3>
                  <div className="space-y-2">
                    {requirements.map((req: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Code className="h-4 w-4 text-gray-400" />
                        {req.name || req}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'reviews' && (
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-4xl font-black text-gray-900 dark:text-gray-100">{mod.rating?.toFixed(1) || '0.0'}</p>
                  <div className="flex items-center justify-center mt-1">{renderStars(mod.rating || 0)}</div>
                  <p className="text-xs text-gray-500 mt-1">{reviewCount} avis</p>
                </div>
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                            {(review.user?.name || review.user || '?')[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{review.user?.name || review.user || 'Utilisateur'}</span>
                        </div>
                        <span className="text-xs text-gray-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : review.date || ''}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-2">{renderStars(review.rating || review.note || 0)}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment || review.content || ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Aucun avis pour le moment</p>
              )}
            </Card>
          )}

          {activeTab === 'faq' && (
            <Card>
              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq: any, i: number) => (
                    <details key={i} className="group">
                      <summary className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{faq.q || faq.question || faq.title}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <p className="px-4 pb-4 pt-2 text-sm text-gray-600 dark:text-gray-400">{faq.a || faq.answer || faq.content}</p>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Aucune FAQ disponible</p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Développeur</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-brand flex items-center justify-center text-white font-bold shrink-0">
                {(devName || '?')[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{devName}</p>
                {mod.developer?.createdAt && (
                  <p className="text-xs text-gray-500">Membre depuis {new Date(mod.developer.createdAt).getFullYear()}</p>
                )}
              </div>
            </div>
            <Link href={`/developer/${mod.developer?.id || devName}`}>
              <Button variant="secondary" size="sm" fullWidth>
                <ExternalLink className="h-4 w-4 mr-1.5" />Voir le profil
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="font-medium text-gray-900 dark:text-gray-100">{mod.version || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Catégorie</span><span className="font-medium text-gray-900 dark:text-gray-100">{mod.category || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dernière MAJ</span><span className="font-medium text-gray-900 dark:text-gray-100">{mod.updatedAt ? new Date(mod.updatedAt).toLocaleDateString('fr-FR') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Licence</span><span className="font-medium text-gray-900 dark:text-gray-100">{mod.license || 'Standard'}</span></div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" fullWidth>
                <Share2 className="h-4 w-4 mr-1.5" />Partager
              </Button>
              {mod.documentation && (
                <a href={mod.documentation} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" fullWidth>
                    <FileText className="h-4 w-4 mr-1.5" />Documentation
                  </Button>
                </a>
              )}
              <Button variant="secondary" size="sm" fullWidth>
                <MessageCircle className="h-4 w-4 mr-1.5" />Contacter le dev
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
