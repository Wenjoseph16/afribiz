'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Clock,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';

interface ImportPreview {
  row: number;
  name: string;
  price: string;
  stock: string;
  barcode: string;
  category: string;
  sku: string;
  errors: string[];
  valid: boolean;
}

interface ImportHistoryItem {
  id: string;
  date: string;
  fileName: string;
  total: number;
  imported: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

const CSV_TEMPLATE_COLUMNS = [
  'name*',
  'shortDescription',
  'description',
  'brand',
  'sku',
  'barcode',
  'categoryId',
  'tags',
  'price*',
  'currency',
  'stock*',
  'lowStockThreshold',
  'unit',
  'weight',
  'weightUnit',
  'dimensions',
  'isPromotional',
  'promotionalPrice',
  'discountPercent',
];

/** Valide une ligne CSV et retourne les erreurs */
function validateRow(row: Record<string, string>, index: number): ImportPreview {
  const errors: string[] = [];
  const name = (row['name'] || '').trim();
  const price = (row['price'] || '').trim();
  const stock = (row['stock'] || '').trim();
  const barcode = (row['barcode'] || '').trim();
  const sku = (row['sku'] || '').trim();
  const category = (row['categoryId'] || row['category'] || '').trim();

  if (!name) errors.push('Nom manquant');
  if (!price || isNaN(Number(price)) || Number(price) <= 0) errors.push('Prix invalide');
  if (stock !== '' && (isNaN(Number(stock)) || Number(stock) < 0)) errors.push('Stock invalide');

  return {
    row: index + 1,
    name,
    price,
    stock,
    barcode,
    category,
    sku,
    errors,
    valid: errors.length === 0,
  };
}

/** Transforme une ligne CSV brute en objet produit pour le backend */
function rowToProduct(row: Record<string, string>): Record<string, unknown> {
  const tags = (row['tags'] || '')
    .split(/[;,]/)
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    name: (row['name'] || '').trim(),
    shortDescription: (row['shortDescription'] || '').trim() || undefined,
    description: (row['description'] || '').trim() || undefined,
    brand: (row['brand'] || '').trim() || undefined,
    sku: (row['sku'] || '').trim() || undefined,
    barcode: (row['barcode'] || '').trim() || undefined,
    categoryId: (row['categoryId'] || '').trim() || undefined,
    tags,
    price: Number(row['price'] || 0),
    currency: (row['currency'] || 'FCFA').trim(),
    stock: Number(row['stock'] || 0),
    lowStockThreshold: row['lowStockThreshold'] ? Number(row['lowStockThreshold']) : 5,
    unit: (row['unit'] || 'piece').trim(),
    weight: row['weight'] ? Number(row['weight']) : undefined,
    weightUnit: (row['weightUnit'] || 'kg').trim(),
    dimensions: (row['dimensions'] || '').trim() || undefined,
    isPromotional:
      (row['isPromotional'] || '').toLowerCase() === 'true' ||
      (row['isPromotional'] || '').toLowerCase() === 'oui',
    promotionalPrice: row['promotionalPrice'] ? Number(row['promotionalPrice']) : undefined,
    discountPercent: row['discountPercent'] ? Number(row['discountPercent']) : 0,
  };
}

export default function ImportProductsPage() {
  const { notify } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    total: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [preview, setPreview] = useState<ImportPreview[] | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: (products: Record<string, unknown>[]) => apiClient.importProducts({ products }),
    onSuccess: (res: any) => {
      const data = res?.data || res;
      setImportResult({
        imported: data.imported || 0,
        total: data.total || 0,
        errors: data.errors || [],
      });
      setImporting(false);
      notify({
        title: 'Import terminé',
        description: `${data.imported || 0}/${data.total || 0} produits importés`,
        variant: 'success',
      });
    },
    onError: (err: any) => {
      setImporting(false);
      notify({
        title: "Erreur d'import",
        description: err.message || 'Une erreur est survenue',
        variant: 'error',
      });
    },
  });

  const parseCSV = useCallback(
    (file: File) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().replace(/\*/g, ''),
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          setRawRows(rows);
          const validated = rows.map((row, i) => validateRow(row, i));
          setPreview(validated);
          setImportResult(null);
        },
        error: (err) => {
          notify({
            title: 'Erreur de parsing',
            description: err.message,
            variant: 'error',
          });
        },
      });
    },
    [notify]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))
      ) {
        setSelectedFile(file);
        setImportResult(null);
        parseCSV(file);
      }
    },
    [parseCSV]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      parseCSV(file);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setImporting(true);
    const validProducts = rawRows.filter((_, i) => preview[i]?.valid).map(rowToProduct);
    importMutation.mutate(validProducts);
  };

  const downloadTemplate = () => {
    const header = CSV_TEMPLATE_COLUMNS.join(',');
    const sampleRow = [
      'Tissu Wax',
      'Magnifique tissu africain',
      'Description complète du produit...',
      'Wax Africain',
      'WAX-001',
      '4901234567890',
      '',
      'wax;africain',
      '5000',
      'FCFA',
      '45',
      '10',
      'pièce',
      '0.5',
      'kg',
      '100x150',
      'false',
      '',
      '0',
    ].join(',');
    const csv = header + '\n' + sampleRow + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPreviewErrors = preview?.reduce((acc, p) => acc + p.errors.length, 0) || 0;
  const totalPreviewValid = preview?.filter((p) => p.valid).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Import / Export"
        description="Importez ou exportez vos produits en masse"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Produits', href: '/dashboard/products' },
          { label: 'Import / Export' },
        ]}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileText className="h-4 w-4 mr-1.5" />
              Template CSV
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 flex">
        <button
          onClick={() => setActiveTab('import')}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
            activeTab === 'import'
              ? 'bg-brand text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <Upload className="h-4 w-4 inline mr-1.5" />
          Importer
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
            activeTab === 'history'
              ? 'bg-brand text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <Clock className="h-4 w-4 inline mr-1.5" />
          Historique
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Import success */}
          {importResult && (
            <Card className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Import terminé !
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {importResult.imported} produits importés avec succès
                {importResult.errors.length > 0 && `, ${importResult.errors.length} erreur(s)`}
              </p>
              {importResult.errors.length > 0 && (
                <div className="max-w-md mx-auto text-left mb-4">
                  <p className="text-xs font-semibold text-red-600 mb-2">Erreurs :</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 20).map((e, i) => (
                      <p key={i} className="text-xs text-red-500">
                        Ligne {e.row} : {e.error}
                      </p>
                    ))}
                    {importResult.errors.length > 20 && (
                      <p className="text-xs text-gray-400">
                        … et {importResult.errors.length - 20} autres erreurs
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFile(null);
                    setPreview(null);
                    setRawRows([]);
                  }}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Importer un autre fichier
                </Button>
                <Link href="/dashboard/products">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-1.5" />
                    Voir les produits
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Upload zone */}
          {!importResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200',
                dragOver
                  ? 'border-brand bg-brand/5 scale-[1.01]'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand/50 bg-gray-50/50 dark:bg-gray-800/50'
              )}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="h-8 w-8 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} Ko
                      {preview && ` · ${preview.length} lignes`}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                        setRawRows([]);
                      }}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Changer
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleImport}
                      isLoading={importing}
                      disabled={!preview || totalPreviewValid === 0}
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Importer ({totalPreviewValid} produits)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Glissez votre fichier CSV ici
                    </p>
                    <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir</p>
                  </div>
                  <p className="text-xs text-gray-400">Format supporté : CSV</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1.5" />
                    Sélectionner un fichier
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {preview && !importResult && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Aperçu ({totalPreviewValid} valide{totalPreviewValid > 1 ? 's' : ''},{' '}
                  {totalPreviewErrors} erreur{totalPreviewErrors > 1 ? 's' : ''})
                </h3>
                <span className="text-xs text-gray-400">{preview.length} lignes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        #
                      </th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        Nom
                      </th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-500 uppercase">
                        Prix
                      </th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        Code-barres
                      </th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        Catégorie
                      </th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        Erreurs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {preview.map((row) => (
                      <tr
                        key={row.row}
                        className={cn(!row.valid && 'bg-red-50/50 dark:bg-red-900/10')}
                      >
                        <td className="p-2 text-xs text-gray-400">{row.row}</td>
                        <td
                          className={cn(
                            'p-2 font-medium',
                            row.name ? 'text-gray-900 dark:text-gray-100' : 'text-red-500'
                          )}
                        >
                          {row.name || '(vide)'}
                        </td>
                        <td
                          className={cn(
                            'p-2 text-right',
                            row.price && !isNaN(Number(row.price))
                              ? 'text-gray-900 dark:text-gray-100'
                              : 'text-red-500'
                          )}
                        >
                          {row.price || '-'}
                        </td>
                        <td
                          className={cn(
                            'p-2 text-right',
                            row.stock !== '' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                          )}
                        >
                          {row.stock || '0'}
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-300 font-mono text-xs">
                          {row.barcode || '-'}
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-300">
                          {row.category || '-'}
                        </td>
                        <td className="p-2">
                          {row.errors.length > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              <span className="text-xs text-red-600">{row.errors.join(', ')}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  <Info className="h-3.5 w-3.5 inline mr-1" />
                  Les lignes en rouge seront ignorées lors de l&apos;import
                </p>
                <Button
                  size="sm"
                  onClick={handleImport}
                  isLoading={importing}
                  disabled={totalPreviewValid === 0}
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Importer ({totalPreviewValid} produits)
                </Button>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Instructions
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>
                1. Téléchargez le{' '}
                <button
                  onClick={downloadTemplate}
                  className="text-brand hover:underline font-medium"
                >
                  template CSV
                </button>
              </p>
              <p>2. Remplissez les colonnes (les champs marqués * sont obligatoires)</p>
              <p>3. Glissez-déposez votre fichier ou cliquez pour sélectionner</p>
              <p>4. Vérifiez l&apos;aperçu avant d&apos;importer</p>
              <p className="text-xs text-gray-400 mt-2">
                Colonnes obligatoires : <code className="text-brand">name</code>,{' '}
                <code className="text-brand">price</code>, <code className="text-brand">stock</code>
              </p>
              <p className="text-xs text-gray-400">
                Colonnes optionnelles : <code className="text-brand">barcode</code>,{' '}
                <code className="text-brand">sku</code>,{' '}
                <code className="text-brand">categoryId</code>,{' '}
                <code className="text-brand">tags</code>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Historique des imports
            </h3>
            <p className="text-sm text-gray-500">Les imports seront affichés ici après exécution</p>
          </div>
        </div>
      )}
    </div>
  );
}
