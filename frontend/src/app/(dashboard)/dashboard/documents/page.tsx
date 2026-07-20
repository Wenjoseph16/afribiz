'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Search,
  FolderOpen,
  Download,
  Trash2,
  Eye,
  File,
  FileCheck,
  FileSignature,
  Loader,
  FolderPlus,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import ModuleCharts from '@/components/dashboard/ModuleCharts';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import { useDocuments, useDeleteDocument } from '@/features/hooks';
import { CopilotTips } from '@/components/copilot/CopilotTips';

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; color: string; bg: string }
> = {
  CONTRAT: {
    label: 'Contrat',
    icon: FileSignature,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  FACTURE: {
    label: 'Facture',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  CERTIFICATION: {
    label: 'Certification',
    icon: FileCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  LICENCE: {
    label: 'Licence',
    icon: File,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  AUTRE: {
    label: 'Autre',
    icon: FileText,
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-800',
  },
};

const TYPE_TABS = ['TOUS', 'CONTRAT', 'FACTURE', 'CERTIFICATION', 'LICENCE', 'AUTRE'];

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const { data: documents, isLoading } = useDocuments();
  const deleteDoc = useDeleteDocument();

  const docs: any[] = useMemo(() => {
    const raw = Array.isArray(documents) ? documents : [];
    return raw;
  }, [documents]);

  const stats = useMemo(
    () => ({
      total: docs.length,
      contracts: docs.filter((d: any) => d.type === 'CONTRAT').length,
      certifications: docs.filter((d: any) => d.type === 'CERTIFICATION').length,
      licences: docs.filter((d: any) => d.type === 'LICENCE').length,
      invoices: docs.filter((d: any) => d.type === 'FACTURE').length,
    }),
    [docs]
  );

  // Charts data
  const chartData: ModuleChartData = useMemo(
    () => ({
      distribution: TYPE_TABS.filter((t) => t !== 'TOUS')
        .map((t) => ({
          name: TYPE_CONFIG[t]?.label || t,
          value: docs.filter((d: any) => d.type === t).length,
          color:
            t === 'CONTRAT'
              ? '#3b82f6'
              : t === 'FACTURE'
                ? '#8b5cf6'
                : t === 'CERTIFICATION'
                  ? '#10b981'
                  : t === 'LICENCE'
                    ? '#f59e0b'
                    : '#6b7280',
        }))
        .filter((d) => d.value > 0),
      daily: [
        { label: 'Total', value: docs.length },
        { label: 'Contrats', value: stats.contracts },
        { label: 'Certifications', value: stats.certifications },
        { label: 'Factures', value: stats.invoices },
      ],
    }),
    [docs, stats]
  );

  const filtered = useMemo(() => {
    let f = [...docs];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (d: any) =>
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'TOUS') {
      f = f.filter((d: any) => d.type === typeFilter);
    }
    return f;
  }, [docs, search, typeFilter]);

  const getIcon = (type: string) => {
    return TYPE_CONFIG[type]?.icon || FileText;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Documents
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Centralisez tous vos documents professionnels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/documents/categories">
            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4 mr-1.5" />
              Catégories
            </Button>
          </Link>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-1.5" />
            Uploader
          </Button>
        </div>
      </div>

      <CopilotTips moduleKey="DOCUMENTS" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<FolderOpen className="h-5 w-5" />}
          iconBg="bg-brand/10"
          iconColor="text-brand"
          label="Total"
          value={stats.total}
        />
        <StatsCard
          icon={<FileSignature className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Contrats"
          value={stats.contracts}
        />
        <StatsCard
          icon={<FileCheck className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Certifications"
          value={stats.certifications}
        />
        <StatsCard
          icon={<FileText className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Factures"
          value={stats.invoices}
        />
      </div>

      {/* Charts */}
      {chartData.distribution && chartData.distribution.length > 0 && (
        <ModuleCharts
          data={chartData}
          title="RÉPARTITION DES DOCUMENTS"
          distributionLabel="Types"
          dailyLabel="Vue d'ensemble"
        />
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t === 'TOUS' ? 'Tous' : t.charAt(0) + t.slice(1).toLowerCase()}
              <span
                className={`ml-1.5 text-xs ${typeFilter === t ? 'text-white/70' : 'text-gray-400'}`}
              >
                {t === 'TOUS'
                  ? stats.total
                  : t === 'CONTRAT'
                    ? stats.contracts
                    : t === 'FACTURE'
                      ? stats.invoices
                      : t === 'CERTIFICATION'
                        ? stats.certifications
                        : stats.licences}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document (titre, description, type)..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucun document trouvé
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {search ? 'Essayez une autre recherche' : 'Uploader votre premier document'}
          </p>
          {!search && (
            <Button>
              <Upload className="h-4 w-4 mr-1.5" /> Uploader
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc: any) => {
            const Icon = getIcon(doc.type);
            const config = TYPE_CONFIG[doc.type] || TYPE_CONFIG.AUTRE;
            return (
              <div
                key={doc.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-2.5 rounded-xl ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <Badge variant="default" className="text-[10px] uppercase shrink-0">
                      {config.label}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {doc.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-3 flex items-center gap-1 border-t border-gray-100 dark:border-gray-700 pt-3">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand hover:text-brand-600 font-medium px-2 py-1 rounded-lg hover:bg-brand/5 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      Voir
                    </a>
                  )}
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      download
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      DL
                    </a>
                  )}
                  <button
                    onClick={() => deleteDoc.mutate(doc.id)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    Suppr.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
