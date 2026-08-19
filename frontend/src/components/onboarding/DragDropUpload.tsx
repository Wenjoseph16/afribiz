'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

interface Props {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  label?: string;
  hint?: string;
  aspect?: 'square' | 'wide';
  multiple?: boolean;
  max?: number;
  uploadingLabel?: string;
}

export function DragDropUpload({
  value,
  onChange,
  label,
  hint,
  aspect = 'square',
  multiple = false,
  max = 5,
  uploadingLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of list) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await apiClient.post('/upload/media', formData);
          const url: string = res.data?.data?.url;
          if (url) urls.push(url);
        }
        if (multiple) {
          const current = Array.isArray(value) ? value : [];
          onChange([...current, ...urls].slice(0, max));
        } else {
          onChange(urls[0] || '');
        }
      } catch {
        // upload silencieux : l'utilisateur pourra réessayer
      } finally {
        setUploading(false);
      }
    },
    [multiple, value, onChange, max]
  );

  const remove = (idx?: number) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((_, i) => i !== idx));
    } else {
      onChange('');
    }
  };

  if (multiple && Array.isArray(value) && value.length > 0) {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {value.map((url, i) => (
            <div
              key={url + i}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Retirer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {value.length < max && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                upload(e.dataTransfer.files);
              }}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 transition-colors',
                dragging
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500/60 hover:text-emerald-600'
              )}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium">Ajouter</span>
            </button>
          )}
        </div>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  const url = multiple ? '' : (value as string);

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          'relative overflow-hidden border-2 border-dashed rounded-xl transition-colors cursor-pointer group',
          aspect === 'square' ? 'aspect-square w-full max-w-[176px]' : 'w-full aspect-[16/7]',
          dragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500/60'
        )}
      >
        {url ? (
          <>
            <Image src={url} alt="" fill sizes="240px" className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadCloud className="h-6 w-6 text-white" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Retirer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
            ) : (
              <UploadCloud
                className={cn(
                  'h-6 w-6 transition-colors',
                  dragging ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-500'
                )}
              />
            )}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {uploading
                ? uploadingLabel || 'Chargement...'
                : dragging
                  ? 'Déposez ici'
                  : 'Glissez une image'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">ou cliquez pour parcourir</span>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}