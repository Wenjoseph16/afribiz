'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Trash2, ExternalLink, Download,
  FileText, CalendarDays, Clock, HardDrive, FileType,
  Loader, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDocument, useDeleteDocument } from '@/features/hooks';

const TYPE_LABELS: Record<string, string> = {
  CONTRAT: 'Contrat',
  FACTURE: 'Facture',
  CERTIFICATION: 'Certification',
  LICENCE: 'Licence',
  AUTRE: 'Autre',
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const { data: document, isLoading, error, refetch } = useDocument(id);

  const deleteMutation = useDeleteDocument();

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!document) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-900/20">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <p className="text-gray-500 text-sm">Le module Documents est en cours de développement</p>
      <Link href="/dashboard/documents">
        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour aux documents</Button>
      </Link>
    </div>
  );

  const doc: any = document;
  const createdDate = doc.createdAt ? new Date(doc.createdAt) : null;
  const expiresDate = doc.expiresAt ? new Date(doc.expiresAt) : null;
  const isExpired = expiresDate && expiresDate < new Date();

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/documents" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/documents/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            onClick={() => { if (confirm('Supprimer ce document ?')) { deleteMutation.mutate(id, { onSuccess: () => router.push('/dashboard/documents') }); } }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />Supprimer
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{doc.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm opacity-90">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                {TYPE_LABELS[doc.type] || doc.type}
              </span>
              {isExpired && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/30 text-xs font-medium">
                  Expiré
                </span>
              )}
            </div>
          </div>
        </div>
        {doc.description && (
          <p className="mt-4 text-sm opacity-80 leading-relaxed">{doc.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {doc.fileUrl && (
              <>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Voir
                  </Button>
                </a>
                <a href={doc.fileUrl} download>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1.5" /> Télécharger
                  </Button>
                </a>
              </>
            )}
            {!doc.fileUrl && (
              <p className="text-sm text-gray-500">Aucun fichier associé</p>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Informations</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                <FileType className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{TYPE_LABELS[doc.type] || doc.type}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                <HardDrive className="h-4 w-4 text-gray-400 shrink-0" />
                {formatSize(doc.fileSize)}
              </div>
              {doc.mimeType && (
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  {doc.mimeType}
                </div>
              )}
              {createdDate && (
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
                  Créé le {createdDate.toLocaleDateString('fr-FR')}
                </div>
              )}
              {expiresDate && (
                <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className={isExpired ? 'text-red-500 font-medium' : ''}>
                    Expire le {expiresDate.toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
