'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';

const LEVEL_META: Record<
  string,
  {
    label: string;
    color: 'bronze' | 'silver' | 'gold' | 'platinum';
    icon: typeof Shield;
    desc: string;
  }
> = {
  ARGENT: { label: 'Argent', color: 'silver', icon: Shield, desc: 'Email + téléphone vérifiés' },
  OR: {
    label: 'Or',
    color: 'gold',
    icon: ShieldCheck,
    desc: "Pièce d'identité + photo responsable",
  },
  PLATINE: {
    label: 'Platine',
    color: 'platinum',
    icon: ShieldAlert,
    desc: "30 jours d'activité + vérification terrain",
  },
};

const LEVEL_ORDER = ['ARGENT', 'OR', 'PLATINE'];

function VerificationStep({
  level,
  currentLevel,
  onUpgrade,
  isUpgrading,
  requiresUpload,
  uploadLabel,
  onToast,
}: {
  level: string;
  currentLevel: string;
  onUpgrade: (data?: any) => void;
  isUpgrading: boolean;
  requiresUpload?: boolean;
  uploadLabel?: string;
  onToast: (message: string, variant: 'success' | 'error') => void;
}) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  const idx = LEVEL_ORDER.indexOf(level);
  const curIdx = LEVEL_ORDER.indexOf(currentLevel);
  const isUnlocked = idx <= curIdx;
  const isCurrent = level === currentLevel;

  const [files, setFiles] = useState<Record<string, File>>({});
  const [uploading, setUploading] = useState(false);

  const handleFile = (key: string, file: File | null) => {
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleUpgrade = async () => {
    if (requiresUpload && Object.keys(files).length === 0) {
      onToast('Veuillez fournir les documents requis', 'error');
      return;
    }
    setUploading(true);
    try {
      const data: any = {};
      if (requiresUpload) {
        for (const [key, file] of Object.entries(files)) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await apiClient.post('/upload', formData);
          data[key] = uploadRes.data.data.url;
        }
      }
      onUpgrade(Object.keys(data).length ? data : undefined);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      className={`p-6 ${isCurrent ? 'ring-2 ring-yellow-400' : isUnlocked ? 'opacity-70' : 'opacity-40'} dark:bg-gray-800/50`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-full ${
            isCurrent
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : isUnlocked
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          }`}
        >
          {isUnlocked ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{meta.label}</h3>
            {isCurrent && <Badge variant="warning">Actuel</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{meta.desc}</p>

          {isCurrent && idx < LEVEL_ORDER.length - 1 && (
            <div className="space-y-3">
              {requiresUpload && (
                <div className="space-y-2">
                  {uploadLabel && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{uploadLabel}</p>
                  )}
                  {level === 'OR' && (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Pièce d&apos;identité (CNI/Passeport)
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFile('identityDocument', e.target.files?.[0] ?? null)
                          }
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Photo du responsable
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFile('responsiblePhoto', e.target.files?.[0] ?? null)
                          }
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpgrade}
                isLoading={isUpgrading || uploading}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Passer à {LEVEL_META[LEVEL_ORDER[idx + 1]].label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['verification'],
    queryFn: async () => {
      const res = await apiClient.getVerification();
      return res.data.data;
    },
  });

  const upgradeOr = useMutation({
    mutationFn: async (docData: { identityDocument: string; responsiblePhoto: string }) => {
      const res = await apiClient.upgradeToOr(docData);
      return res.data.data;
    },
    onSuccess: () => {
      addToast({ title: 'Félicitations ! Vous êtes maintenant niveau Or', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['verification'] });
      setUpgrading(null);
    },
    onError: (err: any) => {
      addToast({
        title: err?.response?.data?.error ?? 'Erreur lors de la mise à jour',
        variant: 'error',
      });
      setUpgrading(null);
    },
  });

  const upgradePlatine = useMutation({
    mutationFn: async () => {
      const res = await apiClient.upgradeToPlatine();
      return res.data.data;
    },
    onSuccess: () => {
      addToast({
        title: 'Félicitations ! Vous êtes maintenant niveau Platine',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['verification'] });
      setUpgrading(null);
    },
    onError: (err: any) => {
      addToast({
        title: err?.response?.data?.error ?? 'Erreur lors de la mise à jour',
        variant: 'error',
      });
      setUpgrading(null);
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!data)
    return <EmptyState title="Vérification" description="Impossible de charger les informations" />;

  const currentLevel = data.level ?? 'ARGENT';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vérification & Confiance"
        description="Augmentez votre niveau de confiance pour débloquer des limites plus élevées"
        breadcrumbs={[{ label: 'Entreprise' }, { label: 'Vérification' }]}
      />

      <div className="grid gap-4">
        {LEVEL_ORDER.map((level) => (
          <VerificationStep
            key={level}
            level={level}
            currentLevel={currentLevel}
            onToast={(message, variant) => addToast({ title: message, variant }) as void}
            onUpgrade={(docData) => {
              setUpgrading(level);
              if (level === 'ARGENT') {
                upgradeOr.mutate(docData as any);
              } else if (level === 'OR') {
                upgradePlatine.mutate();
              }
            }}
            isUpgrading={upgrading === level}
            requiresUpload={level === 'ARGENT'}
            uploadLabel="Documents requis pour passer au niveau Or"
          />
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Avantages par niveau
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Argent</p>
            <ul className="text-gray-500 dark:text-gray-400 list-disc list-inside space-y-0.5">
              <li>Montant max par transaction : 500 000 CFA</li>
              <li>Jusqu&apos;à 50 transactions/jour</li>
              <li>Commission : 3.5%</li>
              <li>Délai escrow : 7 jours</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Or</p>
            <ul className="text-gray-500 dark:text-gray-400 list-disc list-inside space-y-0.5">
              <li>Montant max par transaction : 2 000 000 CFA</li>
              <li>Jusqu&apos;à 200 transactions/jour</li>
              <li>Commission : 2.5%</li>
              <li>Délai escrow : 3 jours</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Platine</p>
            <ul className="text-gray-500 dark:text-gray-400 list-disc list-inside space-y-0.5">
              <li>Montant max par transaction : Illimité</li>
              <li>Jusqu&apos;à 1 000 transactions/jour</li>
              <li>Commission : 1.5%</li>
              <li>Délai escrow : 24h</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
