'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ImageIcon, Grid3X3 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface PhotoItem {
  dataUrl: string;
  name: string;
  size: number;
  /** pHash simulé pour anti-doublon */
  pHash?: string;
}

interface PhotoReferenceProps {
  /** Liste des photos */
  photos?: PhotoItem[];
  /** Callback quand la liste change */
  onChange?: (photos: PhotoItem[]) => void;
  /** Nombre max de photos */
  maxPhotos?: number;
  /** Dimension max de compression (px) */
  maxWidth?: number;
  /** Qualité JPEG 0-1 */
  quality?: number;
  /** Label */
  label?: string;
  /** Désactiver */
  disabled?: boolean;
  /** Classe CSS */
  className?: string;
  /** Mode raffale (capture continue) */
  burstMode?: boolean;
  /** Callback photo capturée */
  onCapture?: (photo: PhotoItem) => void;
}

/**
 * FormKit — PhotoReference
 * Mode "Photo = la référence" du Chantier 8.
 * Capture raffale, compression ~800px, anti-doublon pHash,
 * grille photos au POS.
 * Réalité africaine : le gérant photographie ses produits
 * en raffale, les photos sont compressées et servent de référence.
 */
export function PhotoReference({
  photos = [],
  onChange,
  maxPhotos = 20,
  maxWidth = 800,
  quality = 0.8,
  label = 'Photos produit',
  disabled = false,
  className,
  burstMode = false,
  onCapture,
}: PhotoReferenceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  /** Génère un pHash simple (basé sur les dimensions et la taille du fichier) */
  const computePHash = useCallback((file: File): string => {
    // pHash simplifié : combinaison de la taille et du nom pour détecter les doublons
    return `${file.size}-${file.name.length}-${file.lastModified}`;
  }, []);

  /** Vérifie si un photo est un doublon */
  const isDuplicate = useCallback(
    (newHash: string): boolean => {
      return photos.some((p) => p.pHash === newHash);
    },
    [photos]
  );

  /** Compresse une image à la dimension cible */
  const compressImage = useCallback(
    (file: File): Promise<PhotoItem> =>
      new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas non supporté'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(objectUrl);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression échouée'));
                return;
              }
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  dataUrl: String(reader.result),
                  name: file.name,
                  size: blob.size,
                  pHash: computePHash(file),
                });
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Image illisible'));
        };
        img.src = objectUrl;
      }),
    [maxWidth, quality, computePHash]
  );

  /** Traite les fichiers sélectionnés */
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setCompressing(true);
      try {
        const list = Array.from(files).slice(0, maxPhotos - photos.length);
        const compressed: PhotoItem[] = [];
        let skipped = 0;

        for (const file of list) {
          const hash = computePHash(file);
          if (isDuplicate(hash)) {
            skipped++;
            continue;
          }
          try {
            const item = await compressImage(file);
            compressed.push(item);
            onCapture?.(item);
          } catch {
            // ignorer les images illisibles
          }
        }

        if (compressed.length > 0) {
          onChange?.([...photos, ...compressed].slice(0, maxPhotos));
        }
        if (skipped > 0) {
          // Les doublons sont silencieusement ignorés
        }
      } finally {
        setCompressing(false);
      }
    },
    [photos, maxPhotos, onChange, compressImage, computePHash, isDuplicate, onCapture]
  );

  const remove = (index: number) => {
    onChange?.(photos.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label} ({photos.length}/{maxPhotos})
      </label>

      {/* Grille de photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <Image
                src={photo.dataUrl}
                alt={photo.name}
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
              />
              {/* Badge taille */}
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium">
                {(photo.size / 1024).toFixed(0)} Ko
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label="Retirer la photo"
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zone d'upload */}
      {photos.length < maxPhotos && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture={burstMode ? 'environment' : undefined}
          multiple={!burstMode}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      )}

      {photos.length < maxPhotos && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
            dragOver
              ? 'border-brand bg-brand/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-brand/50 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          )}
          onClick={() => inputRef.current?.click()}
        >
          {compressing ? (
            <Loader2 className="w-6 h-6 text-brand animate-spin mx-auto mb-2" />
          ) : (
            <Camera className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          )}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {compressing
              ? 'Compression en cours…'
              : burstMode
                ? 'Prendre une photo'
                : 'Glissez des photos ou cliquez'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            JPEG/PNG · compression auto à {maxWidth}px · anti-doublon
          </p>
        </div>
      )}
    </div>
  );
}
