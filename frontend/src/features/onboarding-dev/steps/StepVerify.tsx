'use client';

import { useRef, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  FileText,
  Camera,
  Check,
  AlertCircle,
  Clock,
  BadgeCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSubmitDeveloperVerification } from '@/features/developerHooks';

interface DocState {
  name: string;
  url: string;
}

const DOCS = [
  {
    key: 'identityDoc',
    label: "Pièce d'identité *",
    desc: 'Passeport, CNI ou permis — requis pour le badge Vérifié et la publication de modules',
    icon: Camera,
    accept: 'image/*,.pdf',
    required: true,
  },
  {
    key: 'companyDoc',
    label: "Document d'entreprise",
    desc: 'Registre de commerce ou patente (optionnel)',
    icon: FileText,
    accept: 'image/*,.pdf',
    required: false,
  },
  {
    key: 'responsiblePhoto',
    label: 'Selfie avec pièce',
    desc: 'Renforce votre dossier de vérification (optionnel)',
    icon: Camera,
    accept: 'image/*',
    required: false,
  },
] as const;

export default function StepVerify({
  strength,
  verificationStatus,
  rejectionReason,
  disabled,
  onIdentityDocChange,
}: {
  data: unknown;
  strength: number;
  verificationStatus?: string;
  rejectionReason?: string | null;
  disabled: boolean;
  onIdentityDocChange: (has: boolean) => void;
}) {
  const submit = useSubmitDeveloperVerification();
  const [docs, setDocs] = useState<Record<string, DocState | null>>({
    identityDoc: null,
    companyDoc: null,
    responsiblePhoto: null,
  });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (key: string, file: File) => {
    setError('');
    setUploadingKey(key);
    try {
      const { uploadFile } = await import('../upload');
      const url = await uploadFile(file);
      if (!url) throw new Error("Échec de l'upload");
      setDocs((prev) => ({ ...prev, [key]: { name: file.name, url } }));
      if (key === 'identityDoc') onIdentityDocChange(true);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'upload");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async () => {
    const identity = docs.identityDoc;
    if (!identity) {
      setError('La pièce d’identité est requise pour obtenir le badge Vérifié');
      return;
    }
    setError('');
    try {
      await submit.mutateAsync({
        identityDoc: identity.url,
        companyDoc: docs.companyDoc?.url || '',
        responsiblePhoto: docs.responsiblePhoto?.url || '',
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Erreur lors de la soumission');
    }
  };

  const removeDoc = (key: string) => {
    setDocs((prev) => ({ ...prev, [key]: null }));
    if (key === 'identityDoc') onIdentityDocChange(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Vérification d&apos;identité
          </h3>
          <p className="text-xs text-gray-500">
            Obligatoire pour publier des modules — validée par l&apos;équipe AfriBiz sous 48h
          </p>
        </div>
      </div>

      {/* Statut existant */}
      {verificationStatus === 'PENDING' && !submitted && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
          <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Vos documents sont en cours d&apos;examen. Vous pouvez mettre à jour votre dossier
            ci-dessous.
          </p>
        </div>
      )}
      {verificationStatus === 'VERIFIED' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
          <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Votre identité est vérifiée ✓ Vous pouvez publier vos modules.
          </p>
        </div>
      )}
      {verificationStatus === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-700 dark:text-red-300">
                Votre KYC a été refusé par l'équipe AfriBiz
              </p>
              {rejectionReason && (
                <p className="text-red-600 dark:text-red-400 mt-1">
                  <span className="font-semibold">Motif :</span> {rejectionReason}
                </p>
              )}
              <p className="text-xs text-red-500 dark:text-red-400/80 mt-2">
                Corrigez le point signalé puis soumettez à nouveau vos documents. L'accès à votre
                espace développeur sera débloqué après validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploads */}
      <div className="grid gap-4">
        {DOCS.map((doc) => (
          <div
            key={doc.key}
            className={cn(
              'relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
              docs[doc.key]
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-brand/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
            )}
          >
            <div
              className={cn(
                'p-3 rounded-lg shrink-0',
                docs[doc.key]
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              )}
            >
              <doc.icon
                className={cn('h-6 w-6', docs[doc.key] ? 'text-emerald-600' : 'text-gray-400')}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.label}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{doc.desc}</p>
              {docs[doc.key] && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    {docs[doc.key]!.name}
                  </span>
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1">
              {docs[doc.key] ? (
                <button
                  type="button"
                  onClick={() => removeDoc(doc.key)}
                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
                >
                  Retirer
                </button>
              ) : (
                <>
                  <input
                    ref={(el) => {
                      inputRefs.current[doc.key] = el;
                    }}
                    type="file"
                    accept={doc.accept}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(doc.key, f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={disabled || uploadingKey === doc.key}
                    onClick={() => inputRefs.current[doc.key]?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand-700 shadow-sm disabled:opacity-60"
                  >
                    {uploadingKey === doc.key ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
                    Upload
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Jauge de force du profil */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-brand/5 to-emerald-500/5 border border-brand/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Force du profil
          </span>
          <span
            className={cn(
              'text-lg font-bold',
              strength >= 80
                ? 'text-emerald-500'
                : strength >= 50
                  ? 'text-amber-500'
                  : 'text-gray-400'
            )}
          >
            {strength}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              strength >= 80 ? 'bg-emerald-500' : strength >= 50 ? 'bg-amber-400' : 'bg-gray-300'
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {strength >= 85
            ? 'Excellent — votre profil inspire une confiance maximale.'
            : 'Complétez toutes les étapes pour atteindre un profil 100% crédible.'}
        </p>
      </div>

      {/* Soumission */}
      {!submitted && verificationStatus !== 'VERIFIED' && (
        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <Button
            variant="gradient"
            onClick={handleSubmit}
            isLoading={submit.isPending}
            disabled={disabled}
            className="w-full"
          >
            <ShieldCheck className="h-4 w-4" />
            Soumettre mes documents pour vérification
          </Button>
          <p className="text-[11px] text-gray-400 text-center">
            Documents chiffrés, jamais visibles publiquement. Validation sous 48h ouvrées.
          </p>
        </div>
      )}

      {submitted && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
          <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Documents soumis ! Votre dossier est en cours d&apos;examen par l&apos;équipe AfriBiz.
            L&apos;accès à votre espace développeur et la publication de modules seront débloqués
            dès validation de votre KYC.
          </p>
        </div>
      )}
    </div>
  );
}
