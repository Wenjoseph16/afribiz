'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Save, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateDocument } from '@/features/hooks';

const DOCUMENT_TYPES = ['CONTRAT', 'FACTURE', 'CERTIFICATION', 'LICENCE', 'AUTRE'] as const;

const TYPE_LABELS: Record<string, string> = {
  CONTRAT: 'Contrat',
  FACTURE: 'Facture',
  CERTIFICATION: 'Certification',
  LICENCE: 'Licence',
  AUTRE: 'Autre',
};

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('CONTRAT');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const createMutation = useCreateDocument();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      type,
      description,
      fileUrl,
      ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
    }, {
      onSuccess: () => router.push('/dashboard/documents'),
    });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Nouveau document"
        description="Ajoutez un document professionnel"
        breadcrumbs={[
          { label: 'Documents', href: '/dashboard/documents' },
          { label: 'Nouveau' },
        ]}
        actions={
          <Link href="/dashboard/documents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
            </Button>
          </Link>
        }
      />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre du document *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Contrat de partenariat"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de document *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fichier (URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://exemple.com/document.pdf"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
              <div className="p-2.5 rounded-lg bg-brand/10">
                <Upload className="h-4 w-4 text-brand" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Entrez l'URL du fichier ou utilisez un service de stockage</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date d'expiration (optionnelle)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link href="/dashboard/documents">
              <Button variant="outline" type="button">Annuler</Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              <Upload className="h-4 w-4 mr-1.5" />
              {createMutation.isPending ? 'Envoi...' : 'Uploader le document'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
