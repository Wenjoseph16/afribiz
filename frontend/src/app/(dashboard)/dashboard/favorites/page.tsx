'use client';

import { useState, useMemo } from 'react';
import {
  Heart,
  Star,
  Share2,
  MessageCircle,
  ShoppingBag,
  Calendar,
  Briefcase,
  ExternalLink,
  Search,
  FolderPlus,
  Trash2,
  Grid3X3,
  List,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useFavorites, useRemoveFavorite } from '@/features/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'business' | 'product' | 'service' | 'event';

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: 'all', label: 'Tous', icon: Grid3X3 },
  { key: 'business', label: 'Business', icon: Briefcase },
  { key: 'product', label: 'Produits', icon: ShoppingBag },
  { key: 'service', label: 'Services', icon: Star },
  { key: 'event', label: 'Événements', icon: Calendar },
];

const typeIcons: Record<string, any> = {
  business: Briefcase,
  product: ShoppingBag,
  service: Star,
  event: Calendar,
};

const typePathMap: Record<string, string> = {
  business: 'explore',
  product: 'marketplace',
  service: 'services',
  event: 'events',
};

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [collectionName, setCollectionName] = useState('');

  const { data, isLoading, error, refetch } = useFavorites();
  const { mutate: removeFavorite } = useRemoveFavorite();

  // Collections simulées (viennent du backend plus tard)
  const [collections, setCollections] = useState<{ id: string; name: string; icon: string }[]>([]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const allFavorites: any[] = data?.favorites || data || [];

  const filtered = useMemo(() => {
    let f =
      activeTab === 'all'
        ? allFavorites
        : allFavorites.filter((item: any) => String(item.type).toLowerCase() === activeTab);

    if (search) {
      const q = search.toLowerCase();
      f = f.filter((item: any) => {
        const ref = item.ref || {};
        const name = (ref.name || ref.title || item.name || item.title || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const category = (ref.category || '').toLowerCase();
        return name.includes(q) || type.includes(q) || category.includes(q);
      });
    }

    return f;
  }, [allFavorites, activeTab, search]);

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes favoris"
        description="Retrouvez vos business, produits, services et événements enregistrés"
        breadcrumbs={[{ label: 'Favoris' }]}
      />

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans mes favoris..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Collections */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            options={[
              { value: 'all', label: 'Toutes les collections' },
              ...collections.map((c) => ({ value: c.id, label: c.name })),
            ]}
            className="min-w-[180px]"
          />

          <button
            onClick={() => setShowCreateCollection(true)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-all"
            title="Nouvelle collection"
          >
            <FolderPlus className="h-4 w-4" />
          </button>

          {/* Toggle view */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count =
            activeTab === tab.key
              ? filtered.length
              : tab.key === 'all'
                ? allFavorites.length
                : allFavorites.filter((f: any) => String(f.type).toLowerCase() === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              <span
                className={cn(
                  'ml-1 text-xs',
                  activeTab === tab.key ? 'text-white/70' : 'text-gray-400'
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste / Grille */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-10 w-10" />}
          title={search ? 'Aucun résultat' : 'Aucun favori'}
          description={
            search
              ? 'Aucun favori ne correspond à votre recherche.'
              : "Vous n'avez pas encore ajouté de favoris. Explorez la marketplace pour enregistrer vos coups de cœur."
          }
          action={
            !search ? (
              <Link href="/marketplace">
                <Button>Explorer la marketplace</Button>
              </Link>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item: any, idx: number) => {
              const ref = item.ref || {};
              const name = ref.name || ref.title || item.name || item.title || 'Favori';
              const type = item.type?.toLowerCase();
              const TypeIcon = typeIcons[type] || Heart;
              const itemSlug = ref.slug || '';
              const typePath = typePathMap[type] || 'explore';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/20 flex items-center justify-center text-brand shrink-0">
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link
                    href={itemSlug ? `/dashboard/${typePath}/${itemSlug}` : '/marketplace'}
                    className="block group/card"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover/card:text-brand transition-colors line-clamp-2">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {type} {ref.category ? `· ${ref.category}` : ''}
                    </p>
                    {ref.rating && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        {ref.rating}
                      </div>
                    )}
                  </Link>
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/dashboard/${typePath || 'explore'}/${itemSlug || ''}`;
                        if (navigator.share) navigator.share({ title: name, url });
                        else navigator.clipboard.writeText(url);
                      }}
                      className="flex-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Partager
                    </button>
                    <Link
                      href={`/dashboard/messages?businessName=${encodeURIComponent(name)}&business=${itemSlug}`}
                      className="flex-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Contacter
                    </Link>
                    <Link
                      href={itemSlug ? `/dashboard/${typePath}/${itemSlug}` : '/marketplace'}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-brand transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Vue liste */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/50">
          <AnimatePresence mode="popLayout">
            {filtered.map((item: any, idx: number) => {
              const ref = item.ref || {};
              const name = ref.name || ref.title || item.name || item.title || 'Favori';
              const type = item.type?.toLowerCase();
              const TypeIcon = typeIcons[type] || Heart;
              const itemSlug = ref.slug || '';
              const typePath = typePathMap[type] || 'explore';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/20 flex items-center justify-center text-brand shrink-0">
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={itemSlug ? `/dashboard/${typePath}/${itemSlug}` : '/marketplace'}
                      className="block"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {type} {ref.category ? `· ${ref.category}` : ''}
                      </p>
                    </Link>
                  </div>
                  {ref.rating && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 shrink-0">
                      <Star className="h-3 w-3 fill-current" />
                      {ref.rating}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/dashboard/messages?businessName=${encodeURIComponent(name)}&business=${itemSlug}`}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal création collection */}
      <AnimatePresence>
        {showCreateCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => {
              setShowCreateCollection(false);
              setCollectionName('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Nouvelle collection
              </h3>
              <input
                type="text"
                placeholder="Nom de la collection..."
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateCollection(false);
                    setCollectionName('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  disabled={!collectionName.trim()}
                  onClick={() => {
                    if (collectionName.trim()) {
                      setCollections((prev) => [
                        ...prev,
                        { id: `col-${Date.now()}`, name: collectionName.trim(), icon: 'heart' },
                      ]);
                      setShowCreateCollection(false);
                      setCollectionName('');
                    }
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-1.5" />
                  Créer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
