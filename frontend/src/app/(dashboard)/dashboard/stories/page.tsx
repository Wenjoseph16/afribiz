'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Sparkles, Plus, Camera, X, Image as ImageIcon,
  Eye, TrendingUp, Users,
  Film
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { StoryRing } from '@/components/stories/StoryRing';
import { StoryViewerDynamic as StoryViewer } from '@/components/stories/StoryViewerDynamic';
import { useActiveStories, useCreateStory, type StoryGroup } from '@/hooks/features/useStories';
import { apiClient } from '@/services/apiClient';

const STORY_TABS = [
  { label: 'Découvrir', value: 'discover', icon: Sparkles },
  { label: 'Mes stories', value: 'mine', icon: Camera },
  { label: 'Analytics', value: 'analytics', icon: TrendingUp },
];

export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreator, setShowCreator] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: groups, isLoading } = useActiveStories();
  const createStory = useCreateStory();

  const blobUrlRef = useRef<string | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  const [storyForm, setStoryForm] = useState({
    mediaUrl: '',
    caption: '',
    linkUrl: '',
    linkTargetType: 'PRODUCT',
  });

  // Derived preview from mediaUrl for UI display
  const preview = storyForm.mediaUrl || null;

  const resetForm = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    selectedFileRef.current = null;
    setStoryForm({ mediaUrl: '', caption: '', linkUrl: '', linkTargetType: 'PRODUCT' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    selectedFileRef.current = file;
    setStoryForm(prev => ({ ...prev, mediaUrl: url }));
  };

  const handleCreateStory = async () => {
    if (!selectedFileRef.current) return;
    try {
      const uploadRes = await apiClient.uploadMedia(selectedFileRef.current);
      const fileUrl = uploadRes.data.data?.url;
      if (!fileUrl) return;
      createStory.mutate({
        mediaUrl: fileUrl,
        mediaType: selectedFileRef.current.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        caption: storyForm.caption || undefined,
        linkUrl: storyForm.linkUrl || undefined,
        linkTargetType: storyForm.linkTargetType || undefined,
      });
      resetForm();
      setShowCreator(false);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const allGroups = groups || [];
  const totalStories = allGroups.reduce((sum, g) => sum + g.stories.length, 0);
  const unviewedGroups = allGroups.filter(g => !g.allViewed).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Stories
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Contenus éphémères de vos commerces préférés
          </p>
        </div>
        <button
          onClick={() => setShowCreator(!showCreator)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            showCreator
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 active:scale-[0.97] shadow-lg shadow-brand-500/25'
          )}
        >
          {showCreator ? (
            <><X className="w-4 h-4" /> Fermer</>
          ) : (
            <><Plus className="w-4 h-4" /> Nouvelle story</>
          )}
        </button>
      </div>

      {/* Story Creator Panel */}
      {showCreator && (
        <Card padding="lg" variant="elevated" className="overflow-hidden animate-fade-in-up border-2 border-dashed border-brand-300/50 dark:border-brand-700/50">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Media upload */}
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-500" />
                Média
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'aspect-[9/16] max-w-[250px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200',
                  preview
                    ? 'border-brand-400/50 bg-brand-50/50 dark:bg-brand-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10'
                )}
              >
                {preview ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image src={preview} alt="Preview" fill className="object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); resetForm(); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-14 h-14 mx-auto rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6 text-brand-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ajouter une photo/vidéo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, MP4 · 9:16
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Form fields */}
            <div className="flex-[2] space-y-4">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Détails
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Légende (optionnelle)
                </label>
                <textarea
                  value={storyForm.caption}
                  onChange={(e) => setStoryForm(prev => ({ ...prev, caption: e.target.value }))}
                  rows={3}
                  placeholder="Une belle description pour votre story..."
                  className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Lien (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={storyForm.linkUrl}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all placeholder:text-gray-400"
                  />
                  <select
                    value={storyForm.linkTargetType}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, linkTargetType: e.target.value }))}
                    className="px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all"
                  >
                    <option value="PRODUCT">Produit</option>
                    <option value="SERVICE">Service</option>
                    <option value="ORDER">Commande</option>
                    <option value="BOOKING">Réservation</option>
                    <option value="EVENT">Événement</option>
                    <option value="CUSTOM_LINK">Lien personnalisé</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCreateStory}
                  disabled={!storyForm.mediaUrl || createStory.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-200 shadow-md shadow-brand-500/20"
                >
                  {createStory.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publication...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Publier la story</>
                  )}
                </button>
                <button
                  onClick={() => { setShowCreator(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0',
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

      {activeTab === 'discover' && (
        <>
          {/* Stats cards — responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-800/20">
                  <Film className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{totalStories}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Stories actives</p>
                </div>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{allGroups.length}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Commerces</p>
                </div>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{unviewedGroups}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Non vues</p>
                </div>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{allGroups.reduce((sum, g) => sum + g.stories.reduce((s, st) => s + (st.viewsCount || 0), 0), 0)}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">Vues totales</p>
                </div>
              </div>
            </Card>
          </div>

          {/* StoryRing */}
          <Card padding="md" variant="elevated" className="overflow-hidden">
            <StoryRing onStoryOpen={(group) => setSelectedGroup(group)} />
          </Card>
        </>
      )}

      {activeTab === 'mine' && (
        <Card padding="lg" variant="elevated" className="text-center py-12 sm:py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center">
              <Camera className="w-7 h-7 text-brand-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Vos stories publiées apparaîtront ici</p>
            <button
              onClick={() => setShowCreator(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-medium hover:from-brand-600 hover:to-brand-700 active:scale-[0.97] transition-all shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Créer une story
            </button>
          </div>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card padding="md" variant="elevated">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-500" />
                Vues par jour
              </h3>
              <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-sm text-gray-400">Graphique à venir</p>
              </div>
            </Card>
            <Card padding="md" variant="elevated">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" />
                Engagement
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Taux de clics', value: '12.5%', color: 'bg-brand-500' },
                  { label: 'Taux de complétion', value: '78%', color: 'bg-green-500' },
                  { label: 'Partages', value: '45', color: 'bg-purple-500' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Story Viewer (modal) */}
      {selectedGroup && groups && (
        <StoryViewer
          groups={groups}
          initialGroup={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
