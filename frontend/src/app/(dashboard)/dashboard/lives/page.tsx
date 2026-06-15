'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, Calendar, Clock, Users, ShoppingBag, 
  Shield, ChevronRight, Sparkles, Plus,
  Radio, Tv, Eye, MessageCircle, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LivePlayerDynamic as LivePlayer } from '@/components/stories/LivePlayerDynamic';
import { useActiveLives, useCreateLive } from '@/hooks/features/useLives';

const LIVE_TABS = [
  { label: 'En direct', value: 'LIVE', icon: Radio },
  { label: 'Planifiés', value: 'SCHEDULED', icon: Calendar },
  { label: 'Terminés', value: 'ENDED', icon: Clock },
];

export default function LivesPage() {
  const [activeTab, setActiveTab] = useState('LIVE');
  const [selectedLive, setSelectedLive] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveForm, setLiveForm] = useState({ title: '', description: '', scheduledAt: '' });

  const { data: livesData, isLoading } = useActiveLives({
    status: activeTab === 'ALL' ? undefined : activeTab,
    limit: 20,
  });
  const createLive = useCreateLive();

  const lives = livesData?.items || [];

  const handleCreateLive = async () => {
    if (!liveForm.title || !liveForm.scheduledAt) return;
    await createLive.mutateAsync({
      title: liveForm.title,
      description: liveForm.description || undefined,
      scheduledAt: new Date(liveForm.scheduledAt).toISOString(),
    });
    setShowCreateModal(false);
    setLiveForm({ title: '', description: '', scheduledAt: '' });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Lives Commerciaux
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Diffusez en direct et vendez vos produits en temps réel
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 active:scale-[0.97] transition-all shadow-lg shadow-brand-500/25"
        >
          <Plus className="w-4 h-4" />
          Planifier un live
        </button>
      </div>

      {/* Create Live Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Planifier un live</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                <input type="text" value={liveForm.title} onChange={(e) => setLiveForm(p => ({ ...p, title: e.target.value }))} placeholder="Soirée spéciale..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={liveForm.description} onChange={(e) => setLiveForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Décrivez votre live..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date et heure *</label>
                <input type="datetime-local" value={liveForm.scheduledAt} onChange={(e) => setLiveForm(p => ({ ...p, scheduledAt: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
              </div>
              <button
                onClick={handleCreateLive}
                disabled={!liveForm.title || !liveForm.scheduledAt || createLive.isPending}
                className="w-full h-11 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {createLive.isPending ? <><Loader2 className="animate-spin h-4 w-4" /> Création...</> : <><Radio className="w-4 h-4" /> Créer le live</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {LIVE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                isActive
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Selected live player */}
      {selectedLive && (
        <Card padding="lg" variant="elevated">
          <LivePlayer live={selectedLive} onClose={() => setSelectedLive(null)} />
        </Card>
      )}

      {/* Lives grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : lives.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Tv className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'LIVE' ? 'Aucun live en ce moment' : 
               activeTab === 'SCHEDULED' ? 'Aucun live planifié' : 'Aucun live terminé'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Créez votre premier live pour commencer à vendre en direct
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lives.map((live: any) => (
            <button
              key={live.id}
              onClick={() => setSelectedLive(live)}
              className="group text-left"
            >
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="aspect-video relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  {live.coverImage ? (
                    <Image
                      src={live.coverImage}
                      alt={live.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Radio className="w-10 h-10 text-gray-600" />
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {live.status === 'LIVE' && (
                      <Badge variant="danger">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          EN DIRECT
                        </span>
                      </Badge>
                    )}
                    {live.status === 'SCHEDULED' && (
                      <Badge variant="warning">
                        <Calendar className="w-3 h-3 mr-0.5" />
                        Planifié
                      </Badge>
                    )}
                    {live.status === 'ENDED' && (
                      <Badge variant="default">Terminé</Badge>
                    )}
                    {live.hasEscrow && (
                      <Badge variant="brand">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Escrow
                      </Badge>
                    )}
                  </div>

                  {/* Stats overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                      <Users className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{live.viewerCount || live._count?.participants || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
                      <ShoppingBag className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{live._count?.products || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {live.title}
                  </h3>
                  {live.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {live.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {live.business?.logo ? (
                        <Image src={live.business.logo} alt="" width={20} height={20} className="rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">{live.business?.name}</span>
                    </div>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {livesData && livesData.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {livesData.page} / {livesData.totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
