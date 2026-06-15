'use client';

import { useState } from 'react';
import { Heart, Star, Share2, MessageCircle, ShoppingBag, Calendar, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useFavorites, useRemoveFavorite } from '@/features/hooks';

type TabType = 'all' | 'business' | 'product' | 'service' | 'event';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'business', label: 'Business' },
  { key: 'product', label: 'Produits' },
  { key: 'service', label: 'Services' },
  { key: 'event', label: 'Événements' },
];

const typeIcons: Record<string, any> = {
  business: Briefcase,
  product: ShoppingBag,
  service: Star,
  event: Calendar,
};

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { data, isLoading, error, refetch } = useFavorites();
  const { mutate: removeFavorite } = useRemoveFavorite();

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const allFavorites: any[] = data?.favorites || data || [];

  const filtered = activeTab === 'all'
    ? allFavorites
    : allFavorites.filter((f: any) => String(f.type).toLowerCase() === activeTab);

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mes favoris"
        description="Retrouvez vos business, produits, services et événements enregistrés"
        breadcrumbs={[{ label: 'Favoris' }]}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({allFavorites.filter((f: any) => f.type?.toLowerCase() === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-10 w-10" />}
          title="Aucun favori"
          description="Vous n'avez pas encore ajouté de favoris. Explorez la marketplace pour enregistrer vos coups de cœur."
          action={
            <Link href="/dashboard/explore">
              <Button>Explorer la marketplace</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any) => {
            const ref = item.ref || {};
            const name = ref.name || ref.title || item.name || item.title;
            const type = item.type?.toLowerCase();
            const TypeIcon = typeIcons[type] || Heart;
            const itemSlug = ref.slug || '';
            const typePath =
              type === 'business' ? 'explore' :
              type === 'product' ? 'marketplace' :
              type === 'service' ? 'services' :
              type === 'event' ? 'events' : 'explore';
            const itemUrl = itemSlug
              ? `${window.location.origin}/dashboard/${typePath}/${itemSlug}`
              : `${window.location.origin}/dashboard/explore`;
            const contactUrl = ref.userId
              ? `/dashboard/messages?userId=${ref.userId}`
              : '/dashboard/messages';
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-500 font-bold shrink-0">
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{type} {ref.category ? `· ${ref.category}` : ''}</p>
                {ref.rating && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
                    <Star className="h-3 w-3 fill-current" />
                    {ref.rating}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => {
                    if (navigator.share) { navigator.share({ title: name, url: itemUrl }); }
                    else { navigator.clipboard.writeText(itemUrl); alert('Lien copié !'); }
                  }} className="flex-1 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                    <Share2 className="h-3.5 w-3.5" />
                    Partager
                  </button>
                  <button onClick={() => {
                    window.location.href = contactUrl;
                  }} className="flex-1 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Contacter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
