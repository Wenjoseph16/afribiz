'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, X, Image as ImageIcon, Plus } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { useCreateStory } from '@/hooks/features/useStories';
import { useDeveloperModules } from '@/features/developerHooks';
import { apiClient } from '@/services/apiClient';

export default function DeveloperStoriesPage() {
  const [showCreator, setShowCreator] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);
  const fileRef2 = useRef<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const createStory = useCreateStory();
  const { data: modulesData } = useDeveloperModules();
  const modules = Array.isArray(modulesData) ? modulesData : (modulesData as any)?.modules || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    fileRef2.current = file;
    setPreview(url);
  };

  const resetForm = () => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = null;
    fileRef2.current = null;
    setPreview(null);
    setCaption('');
    setSelectedModuleId('');
  };

  const handlePublish = async () => {
    if (!fileRef2.current) return;
    try {
      const uploadRes = await apiClient.uploadMedia(fileRef2.current);
      const fileUrl = uploadRes.data.data?.url;
      if (!fileUrl) return;
      createStory.mutate({
        mediaUrl: fileUrl,
        mediaType: fileRef2.current.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        caption: caption || undefined,
        linkTargetType: 'MODULE',
        linkTargetId: selectedModuleId || undefined,
      });
      resetForm();
      setShowCreator(false);
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Stories"
        description="Publiez des stories pour promouvoir vos modules"
        actions={
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-all"
          >
            {showCreator ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreator ? 'Fermer' : 'Nouvelle story'}
          </button>
        }
      />

      {showCreator && (
        <Card padding="lg" variant="elevated" className="border-2 border-dashed border-brand-300/50">
          <div className="flex flex-col sm:flex-row gap-6">
            <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
              <div className="aspect-[9/16] w-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-brand-400 transition-colors">
                {preview ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image src={preview} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Photo ou vidéo</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Légende</label>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="Présentez votre module..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Module lié (optionnel)</label>
                <select value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                  <option value="">Sélectionner un module</option>
                  {modules.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handlePublish} disabled={!fileRef2.current} className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:shadow-lg transition-all">
                Publier la story
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg">
        <div className="text-center py-12 text-gray-400">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Vos stories apparaîtront ici</p>
          <p className="text-xs mt-1">Les stories sont visibles pendant 24h sur votre Developer TV</p>
        </div>
      </Card>
    </div>
  );
}
