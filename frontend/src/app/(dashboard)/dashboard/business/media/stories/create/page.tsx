'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Upload,
  Image as ImageIcon,
  Film,
  X,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  Eye,
  Check,
  AlertTriangle,
  Type,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { StickerPicker } from '@/components/stories/StickerPicker';
import { useCreateStory } from '@/hooks/features/useStories';
import { apiClient } from '@/services/apiClient';
import type { StorySticker } from '@afribiz/shared';

export default function CreateStoryPage() {
  const router = useRouter();
  const createStory = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'media' | 'customize' | 'preview'>('media');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  // Article shoppable lié (Story → Commander) : le prix affiché vient du moteur de prix
  const [linkTargetType, setLinkTargetType] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopServices, setShopServices] = useState<any[]>([]);
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setUploadError('Format non supporté. Utilisez une image (jpg, png) ou une vidéo (mp4).');
      return;
    }

    setUploadError(null);
    setMediaType(isImage ? 'IMAGE' : 'VIDEO');
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setStep('customize');
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveMedia = useCallback(() => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setUploadError(null);
    setStep('media');
  }, [mediaPreview]);

  const handleAddSticker = useCallback((sticker: StorySticker) => {
    setStickers((prev) => [...prev, sticker]);
  }, []);

  const handleRemoveSticker = useCallback((stickerId: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== stickerId));
  }, []);

  const handlePublish = async () => {
    if (!mediaFile) return;

    setPublishing(true);
    setUploadError(null);

    try {
      // 1. Upload media file
      const formData = new FormData();
      formData.append('file', mediaFile);
      const uploadRes = await apiClient.uploadMedia(mediaFile);
      const mediaUrl = uploadRes.data.data?.url;
      if (!mediaUrl) throw new Error("Échec de l'upload du média");

      // 2. Create story
      await createStory.mutateAsync({
        mediaType,
        mediaUrl,
        caption: caption.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        linkTargetType: linkTargetType || undefined,
        linkTargetId: linkTargetId || undefined,
        stickers: stickers.length > 0 ? stickers : undefined,
      });

      // 3. Redirect to stories page
      router.push('/dashboard/stories');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Erreur lors de la publication';
      setUploadError(msg);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Créer une story"
        description="Partagez une story éphémère (24h) avec vos clients"
        breadcrumbs={[
          { label: 'Business', href: '/dashboard/business' },
          { label: 'Media', href: '/dashboard/business/media' },
          { label: 'Stories', href: '/dashboard/stories' },
          { label: 'Créer' },
        ]}
        gradient
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'media', label: 'Média', icon: ImageIcon },
          { key: 'customize', label: 'Personnaliser', icon: Sparkles },
          { key: 'preview', label: 'Aperçu', icon: Eye },
        ].map((s, i) => {
          const isActive = step === s.key;
          const isDone =
            ['media', 'customize', 'preview'].indexOf(step) >
            ['media', 'customize', 'preview'].indexOf(s.key as any);
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1',
                  isActive
                    ? 'bg-brand text-white shadow-sm'
                    : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                )}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Media upload */}
      {step === 'media' && (
        <Card className="p-8">
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
              <Upload className="w-7 h-7 text-gray-400 group-hover:text-brand transition-colors" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Ajoutez une photo ou une vidéo
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Glissez-déposez ou cliquez pour sélectionner
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> JPG, PNG
              </span>
              <span className="flex items-center gap-1">
                <Film className="w-3.5 h-3.5" /> MP4
              </span>
              <span>Max 10 Mo</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {uploadError && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {uploadError}
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Customize */}
      {step === 'customize' && mediaPreview && (
        <div className="space-y-4">
          {/* Preview mini */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-28 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                {mediaType === 'VIDEO' ? (
                  <video src={mediaPreview} className="w-full h-full object-cover" />
                ) : (
                  <Image src={mediaPreview} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {mediaFile?.name || 'Fichier sélectionné'}
                </p>
                <p className="text-xs text-gray-400">
                  {mediaType === 'IMAGE' ? 'Photo' : 'Vidéo'} &middot;{' '}
                  {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(1)} Mo` : ''}
                </p>
              </div>
              <button
                onClick={handleRemoveMedia}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>

          {/* Caption */}
          <Card className="p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2">
              <Type className="w-4 h-4 text-brand" />
              Texte / Description
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajoutez un texte à votre story..."
              rows={2}
              maxLength={150}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
            />
            <p className="text-right text-[10px] text-gray-400 mt-1">{caption.length}/150</p>
          </Card>

          {/* Article shoppable : la story devient une vitrine commandable */}
          <Card className="p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2">
              <ShoppingBag className="w-4 h-4 text-brand" />
              Commander depuis la story
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={linkTargetType}
                onChange={(e) => {
                  setLinkTargetType(e.target.value);
                  setLinkTargetId('');
                  const t = e.target.value;
                  if (t === 'PRODUCT' && shopProducts.length === 0) {
                    apiClient.getMyProducts({ limit: 200 }).then((res: any) => {
                      const list = res?.data?.data ?? [];
                      setShopProducts(Array.isArray(list) ? list : list.items ?? []);
                    }).catch(() => {});
                  }
                  if (t === 'SERVICE' && shopServices.length === 0) {
                    apiClient.getMyServices({ limit: 200 }).then((res: any) => {
                      const list = res?.data?.data ?? [];
                      setShopServices(Array.isArray(list) ? list : list.items ?? []);
                    }).catch(() => {});
                  }
                }}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Aucun article (story simple)</option>
                <option value="PRODUCT">Produit</option>
                <option value="SERVICE">Service</option>
              </select>
              {linkTargetType && (
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Choisir l'article...</option>
                  {(linkTargetType === 'PRODUCT' ? shopProducts : shopServices).map((it: any) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {linkTargetId && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                ✓ Article lié — le bouton « Commander » affichera le prix réel calculé par
                AfriBiz
              </p>
            )}
          </Card>

          {/* Link */}
          <Card className="p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-2">
              <LinkIcon className="w-4 h-4 text-brand" />
              Lien externe (optionnel)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://afribiz.com/business/mon-business"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-xs text-gray-400 mt-1">
              Les utilisateurs pourront cliquer sur votre story pour être redirigés
            </p>
          </Card>

          {/* Stickers */}
          <StickerPicker
            onAddSticker={handleAddSticker}
            onRemoveSticker={handleRemoveSticker}
            stickers={stickers}
          />
        </div>
      )}

      {/* Step 3: Preview & Publish */}
      {step === 'preview' && mediaPreview && (
        <div className="flex flex-col items-center">
          <div className="relative w-72 aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
            {mediaType === 'VIDEO' ? (
              <video
                src={mediaPreview}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            ) : (
              <Image src={mediaPreview} alt="" fill className="object-cover" />
            )}

            {/* Gradient overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              {caption && (
                <p className="text-white text-sm font-medium drop-shadow-lg">{caption}</p>
              )}
              {linkUrl && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur border border-white/20 text-white text-[10px]">
                  <LinkIcon className="w-3 h-3" />
                  {linkUrl.replace(/^https?:\/\//, '').substring(0, 25)}...
                </div>
              )}
            </div>

            {/* Stickers overlay */}
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="absolute text-white text-xs font-bold drop-shadow-lg"
                style={{
                  left: `${sticker.positionX}%`,
                  top: `${sticker.positionY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {sticker.type === 'POLL' ? (
                  <div className="bg-white/90 text-gray-800 px-2 py-1 rounded-lg text-[10px]">
                    {sticker.label || 'Sondage'}
                  </div>
                ) : (
                  <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded-lg border border-white/30">
                    {sticker.label}
                  </span>
                )}
              </div>
            ))}

            {/* Time badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-[10px] text-white/70">
              24h
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Aperçu de votre story</p>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {step === 'customize' && (
            <Button variant="ghost" size="sm" onClick={handleRemoveMedia}>
              <X className="h-4 w-4 mr-1" />
              Changer le média
            </Button>
          )}
          {step === 'preview' && (
            <Button variant="ghost" size="sm" onClick={() => setStep('customize')}>
              Retour
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {step === 'customize' && (
            <Button onClick={() => setStep('preview')} disabled={!mediaPreview}>
              <Eye className="h-4 w-4 mr-1.5" />
              Aperçu
            </Button>
          )}
          {step === 'preview' && (
            <Button onClick={handlePublish} isLoading={publishing} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Publier la story
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
