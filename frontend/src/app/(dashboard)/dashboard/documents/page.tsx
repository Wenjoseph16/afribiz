'use client';

import { useState } from 'react';
import { FileText, Upload, Search, FolderOpen, Download, Trash2, Eye, Plus, File, Image, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useDocuments, useDeleteDocument } from '@/features/hooks';

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');

  const { data: documents, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();

  const docs: any[] = Array.isArray(documents) ? documents : [];
  const filtered = docs.filter((d: any) => {
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'TOUS' && d.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: docs.length,
    contracts: docs.filter((d: any) => d.type === 'CONTRAT').length,
    certifications: docs.filter((d: any) => d.type === 'CERTIFICATION').length,
    licences: docs.filter((d: any) => d.type === 'LICENCE').length,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONTRAT': return FileText;
      case 'CERTIFICATION': return FileSpreadsheet;
      case 'LICENCE': return File;
      default: return FileText;
    }
  };

  const typeTabs = ['TOUS', 'CONTRAT', 'FACTURE', 'CERTIFICATION', 'LICENCE', 'AUTRE'];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documents"
        description="Centralisez tous vos documents professionnels"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents' }]}
        actions={
          <Button><Upload className="h-4 w-4 mr-1.5" /> Uploader</Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Total</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold">{stats.contracts}</p><p className="text-sm text-gray-500">Contrats</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold">{stats.certifications}</p><p className="text-sm text-gray-500">Certifications</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold">{stats.licences}</p><p className="text-sm text-gray-500">Licences</p></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un document..." className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {typeTabs.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                typeFilter === t ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>{t === 'TOUS' ? 'Tous' : t.charAt(0) + t.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FolderOpen className="h-12 w-12 text-gray-400" />} title="Aucun document" description="Uploader votre premier document" action={<Button><Upload className="h-4 w-4 mr-1.5" /> Uploader</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: any) => {
            const Icon = getIcon(doc.type);
            return (
              <Card key={doc.id} className="p-4 hover:border-brand/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-brand/10">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.type} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} Ko` : '-'}</p>
                  </div>
                </div>
                {doc.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{doc.description}</p>}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" className="text-xs text-brand hover:underline flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Voir
                    </a>
                  )}
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} download className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <Download className="h-3 w-3" /> Télécharger
                    </a>
                  )}
                  <button onClick={() => deleteDoc.mutate(doc.id)} className="text-xs text-red-500 hover:text-red-700 ml-auto flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
