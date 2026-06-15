'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDocument, useUpdateDocument } from '@/features/hooks';

const DOCUMENT_TYPES = ['CONTRAT', 'FACTURE', 'CERTIFICATION', 'LICENCE', 'AUTRE'] as const;

const TYPE_LABELS: Record<string, string> = {
  CONTRAT: 'Contrat',
  FACTURE: 'Facture',
  CERTIFICATION: 'Certification',
  LICENCE: 'Licence',
  AUTRE: 'Autre',
};

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const { data: document, isLoading, error, refetch } = useDocument(id);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('CONTRAT');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (document) {
      const d: any = document;
      setTitle(d.title || '');
      setType(d.type || 'CONTRAT');
      setDescription(d.description || '');
      setFileUrl(d.fileUrl || '');
      setExpiresAt(d.expiresAt ? d.expiresAt.split('T')[0] : '');
    }
  }, [document]);

  const updateMutation = useUpdateDocument();

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!document) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Document introuvable</p></div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id, data: {
      title,
      type,
      description,
      fileUrl,
      ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : { expiresAt: null }),
    } }, {
      onSuccess: () => router.push(`/dashboard/documents/${id}`),
    });
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Modifier le document"
        description="Modifiez les informations de votre document"
        breadcrumbs={[
          { label: 'Documents', href: '/dashboard/documents' },
          { label: (document as any)?.title || 'Modifier' },
        ]}
        actions={
          <Link href={`/dashboard/documents/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
            </Button>
          </Link>
        }
      />

      <Card padding="lg" className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Titre du document *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Ex: Contrat de partenariat" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Type de document *</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document..." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Fichier (URL)</label>
            <div className="flex items-center gap-2">
              <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://exemple.com/document.pdf" className={inputCls} />
              <div className="p-2.5 rounded-lg bg-brand/10"><Upload className="h-4 w-4 text-brand" /></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Entrez l'URL du fichier ou utilisez un service de stockage</p>
          </div>

          <div>
            <label className={labelCls}>Date d'expiration (optionnelle)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link href={`/dashboard/documents/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
