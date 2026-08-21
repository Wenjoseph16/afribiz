'use client';

import { useRef, useState } from 'react';
import { Plus, X, Upload, FileText, Award } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { DevOnboardingData } from '@/types/developer';
import { uploadFile } from '../upload';

interface Props {
  data: DevOnboardingData;
  update: (partial: Partial<DevOnboardingData>) => void;
  disabled: boolean;
}

export default function StepCertifications({ data, update, disabled }: Props) {
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = data.certifications;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        setFileUrl(url);
        setFileName(file.name);
      }
    } finally {
      setUploading(false);
    }
  };

  const addItem = () => {
    if (!name.trim() || items.length >= 10) return;
    update({
      certifications: [
        ...items,
        {
          name: name.trim(),
          issuer: issuer.trim() || undefined,
          year: year ? Number(year) : undefined,
          fileUrl: fileUrl || undefined,
        },
      ],
    });
    setName('');
    setIssuer('');
    setYear('');
    setFileUrl('');
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeItem = (i: number) => update({ certifications: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Certifications & diplômes
          </h3>
          <p className="text-xs text-gray-500">
            Diplômes, certificats en ligne, attestations (0 à 10) — justifiables par un fichier
            (+15% de confiance)
          </p>
        </div>
      </div>

      {/* Liste existante */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {c.name}
                </p>
                <p className="text-xs text-gray-500">
                  {[c.issuer, c.year].filter(Boolean).join(' · ') || '—'}
                  {c.fileUrl && (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      <FileText className="h-3 w-3" /> justificatif
                    </a>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(i)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {items.length < 10 && (
        <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Input
            label="Intitulé *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : AWS Certified Developer"
            maxLength={160}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Émetteur"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Amazon, Coursera…"
              maxLength={120}
            />
            <Input
              label="Année"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              min={1950}
              max={2100}
              placeholder="2025"
            />
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Justificatif
              </span>
              {fileUrl ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 truncate flex-1">
                    {fileName || 'Fichier'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileUrl('');
                      setFileName('');
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled || uploading}
                  onClick={() => fileRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  PDF ou image
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={disabled || !name.trim()}
            onClick={addItem}
          >
            <Plus className="h-4 w-4" />
            Ajouter la certification
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center">
          Optionnel — mais une certification vérifiable distingue clairement votre profil.
        </p>
      )}
    </div>
  );
}
