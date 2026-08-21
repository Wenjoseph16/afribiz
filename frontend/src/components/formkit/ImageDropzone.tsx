'use client';

import { useState, useRef, useCallback } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FormField } from './FormField';

export interface DropImage {
  /** dataURL compressé (prêt à uploader / à montrer) */
  dataUrl: string;
  /** nom original du fichier */
  name: string;
  size: number;
}

interface ImageDropzoneProps {
  images?: DropImage[];
  onChange?: (images: DropImage[]) => void;
  label?: string;
  error?: string;
  help?: string;
  required?: boolean;
  maxImages?: number;
  maxWidth?: number; // dimension max de compression (px), défaut 1200
  quality?: number; // qualité JPEG 0-1, défaut 0.82
  className?: string;
  accept?: string;
}

/**
 * FormKit — ImageDropzone
 * Vrai upload drag & drop multi, avec compression côté client
 * (réalité africaine : une photo de 3 Mo ne part jamais sur du 2G).
 * Remplace les boutons d'upload factices.
 */
export function ImageDropzone({
  images = [],
  onChange,
  label = 'Images',
  error,
  help,
  required,
  maxImages = 6,
  maxWidth = 1200,
  quality = 0.82,
  className,
  accept = 'image/*',
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const compress = useCallback(
    (file: File): Promise<DropImage> =>
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
    [maxWidth, quality]
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setCompressing(true);
    try {
      const list = Array.from(files).slice(0, maxImages - images.length);
      const compressed = await Promise.all(list.map(compress));
      onChange?.([...images, ...compressed].slice(0, maxImages));
    } catch {
      // Une image illisible ne doit pas bloquer les autres
    } finally {
      setCompressing(false);
    }
  };

  const remove = (index: number) => {
    onChange?.(images.filter((_, i) => i !== index));
  };

  return (
    <FormField label={label} error={error} help={help} required={required} className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Grille de previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2.5">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <Image
                src={img.dataUrl}
                alt={img.name}
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Retirer l'image"
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
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
            'w-full rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-2 py-8',
            dragOver
              ? 'border-brand bg-brand/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-brand/60 hover:bg-gray-50 dark:hover:bg-gray-800/40'
          )}
        >
          {compressing ? (
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          ) : (
            <ImagePlus className="w-6 h-6 text-gray-400" />
          )}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {compressing ? 'Compression…' : 'Glissez vos photos ici ou cliquez'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            JPEG/PNG · compression automatique pour l'Afrique ({images.length}/{maxImages})
          </p>
        </button>
      )}
    </FormField>
  );
}
