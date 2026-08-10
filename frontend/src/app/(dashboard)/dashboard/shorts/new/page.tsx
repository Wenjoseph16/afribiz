'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Film,
  Plus,
  X,
  Upload,
  Save,
  Play,
  Type,
  Link as LinkIcon,
  ShoppingBag,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/apiClient';
import { useCreateShort } from '@/hooks/features/useShorts';
import { useNotifyError } from '@/hooks/useNotifyError';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function NewShortPage() {
  const router = useRouter();
  const createShort = useCreateShort();
  const notifyError = useNotifyError();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Link feature
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTargetType, setLinkTargetType] = useState('PRODUCT');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await apiClient.uploadMedia(file);
      if (res.data.success && res.data.data?.url) {
        setVideoUrl(res.data.data.url);
        // If it's a video, we might want to generate a thumbnail,
        // but for now, we'll just use the same URL if it's an image or leave empty
        if (file.type.startsWith('image/')) {
          setThumbnailUrl(res.data.data.url);
        }
      }
    } catch (err) {
      notifyError(err, 'Erreur upload', "Impossible d'importer la vidéo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setIsSaving(true);
    try {
      await createShort.mutateAsync({
        videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        title: title || undefined,
        description: description || undefined,
        linkUrl: linkUrl || undefined,
        linkTargetType: linkTargetType || undefined,
      });
      router.push('/dashboard/shorts');
    } catch (err) {
      notifyError(err, 'Erreur', 'Impossible de publier le short');
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Publier un Short"
        description="Partagez une vidéo courte de votre activité"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Shorts', href: '/dashboard/shorts' },
          { label: 'Publier' },
        ]}
      />

      <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-6">
        {/* Preview & Upload Area */}
        <div className="md:col-span-2">
          <Card className="aspect-[9/16] relative flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800">
            {videoUrl ? (
              <div className="w-full h-full relative">
                {videoUrl.match(/\.(mp4|webm|ogg)$/i) || videoUrl.includes('video') ? (
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <Image src={videoUrl} alt="Preview" fill className="object-cover" sizes="100vw" />
                )}
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-4 cursor-pointer group"
              >
                <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-8 h-8 text-brand" />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white">Ajouter une vidéo</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, MOV ou WebM (9:16)</p>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleVideoUpload}
              className="hidden"
              accept="video/*,image/*"
            />
          </Card>
        </div>

        {/* Form Details */}
        <div className="md:col-span-3 space-y-6">
          <Card padding="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-brand" /> Titre
                </label>
                <Input
                  placeholder="Ex: Nouvelle collection de Wax"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-brand outline-none transition-all resize-none text-sm"
                  rows={4}
                  placeholder="Décrivez ce qui se passe dans cette vidéo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-brand" /> Lien d'action (Optionnel)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={linkTargetType}
                    onChange={(e) => setLinkTargetType(e.target.value)}
                    className="col-span-1 px-3 py-2.5 text-sm rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-brand outline-none transition-all"
                  >
                    <option value="PRODUCT">Produit</option>
                    <option value="SERVICE">Service</option>
                    <option value="EVENT">Événement</option>
                    <option value="CUSTOM_LINK">Lien web</option>
                  </select>
                  <div className="col-span-2">
                    <Input
                      placeholder="Identifiant ou URL..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Ce lien s'affichera sous forme de bouton interactif sur votre vidéo.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3 justify-end">
            <Link href="/dashboard/shorts">
              <Button variant="outline">Annuler</Button>
            </Link>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!videoUrl || isSaving}
              isLoading={isSaving}
            >
              <Save className="w-4 h-4 mr-2" /> Publier le Short
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
