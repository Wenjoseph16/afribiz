'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Upload, Download, FileSpreadsheet, FileText,
  CheckCircle2, AlertCircle, X, Eye,
  Clock, Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ImportPreview {
  row: number;
  name: string;
  price: string;
  stock: string;
  category: string;
  errors: string[];
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

const IMPORT_HISTORY: ImportHistoryItem[] = [
  { id: 'i1', date: '2024-06-10 14:30', fileName: 'produits-juin.csv', total: 25, imported: 23, errors: 2, status: 'partial' },
  { id: 'i2', date: '2024-05-28 09:15', fileName: 'catalogue-complet.csv', total: 50, imported: 50, errors: 0, status: 'success' },
  { id: 'i3', date: '2024-05-15 16:45', fileName: 'nouveautes.csv', total: 12, imported: 0, errors: 12, status: 'failed' },
];

const CSV_TEMPLATE_COLUMNS = [
  'name*', 'shortDescription', 'description', 'brand', 'sku', 'barcode',
  'categoryId', 'tags', 'price*', 'currency', 'stock*', 'minStock', 'unit',
  'weight', 'dimensions', 'isPromotional', 'promotionalPrice', 'discountPercent',
];

export default function ImportProductsPage() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [preview, setPreview] = useState<ImportPreview[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulatePreview = useCallback(() => {
    setPreview([
      { row: 1, name: 'Tissu Wax Africain', price: '5000', stock: '45', category: 'Vêtements', errors: [] },
      { row: 2, name: 'Huile de coco bio', price: '3500', stock: '3', category: 'Cosmétiques', errors: [] },
      { row: 3, name: '', price: '8500', stock: '10', category: 'Accessoires', errors: ['Nom manquant'] },
      { row: 4, name: 'Beurre de karité', price: 'abc', stock: '20', category: 'Cosmétiques', errors: ['Prix invalide'] },
      { row: 5, name: 'Sac en raphia', price: '8500', stock: '', category: 'Accessoires', errors: ['Stock manquant'] },
    ]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
      setImportDone(false);
      setPreview(null);
      simulatePreview();
    }
  }, [simulatePreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportDone(false);
      setPreview(null);
      simulatePreview();
    }
  };

  const handleImport = async () => {
    setImporting(true);
    await new Promise(r => setTimeout(r, 2000));
    setImporting(false);
    setImportDone(true);
    setSelectedFile(null);
    setPreview(null);
  };

  const downloadTemplate = () => {
    const header = CSV_TEMPLATE_COLUMNS.join(',');
    const sampleRow = [
      'Tissu Wax', 'Magnifique tissu', 'Description complète...', 'Wax Africain',
      'WAX-001', '4901234567890', 'cat-1', 'wax,africain',
      '5000', 'FCFA', '45', '10', 'pièce', '0.5', '100x150',
      'false', '', '0',
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

  const exportProducts = () => {
    const header = CSV_TEMPLATE_COLUMNS.join(',');
    const rows = [
      ['Tissu Wax Africain', '', 'Description...', 'Wax Africain', 'WAX-001', '', 'Vêtements', 'wax', '5000', 'FCFA', '45', '10', 'pièce', '0.5', '100x150', 'true', '4000', '20'],
      ['Huile de coco bio', 'Huile naturelle', '', '', 'HUILE-001', '', 'Cosmétiques', 'bio', '3500', 'FCFA', '3', '10', 'pièce', '0.25', '', 'false', '', '0'],
    ];
    const csv = header + '\n' + rows.map(r => r.join(',')).join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPreviewErrors = preview?.reduce((acc, p) => acc + p.errors.length, 0) || 0;
  const totalPreviewValid = preview?.filter(p => p.errors.length === 0).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Import / Export
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Importez ou exportez vos produits en masse
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <FileText className="h-4 w-4 mr-1.5" />
            Template CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportProducts}>
            <Download className="h-4 w-4 mr-1.5" />
            Exporter
          </Button>
        </div>
      </div>

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
          {/* Upload zone */}
          {!importDone && (
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
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedFile(null); setPreview(null); }}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Changer
                    </Button>
                    <Button size="sm" onClick={handleImport} isLoading={importing}>
                      <Upload className="h-4 w-4 mr-1.5" />
                      Importer
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
                      Glissez votre fichier ici
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ou cliquez pour parcourir
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Formats supportés : CSV, XLSX, XLS
                  </p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1.5" />
                    Sélectionner un fichier
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </div>
          )}

          {/* Import success */}
          {importDone && (
            <Card className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Import terminé !
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                23 produits importés avec succès, 2 erreurs
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => { setImportDone(false); setSelectedFile(null); setPreview(null); }}>
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

          {/* Preview */}
          {preview && !importDone && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Aperçu ({totalPreviewValid} valide{totalPreviewValid > 1 ? 's' : ''}, {totalPreviewErrors} erreur{totalPreviewErrors > 1 ? 's' : ''})
                </h3>
                <span className="text-xs text-gray-400">{preview.length} lignes</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase">Erreurs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {preview.map((row) => (
                      <tr key={row.row} className={cn(row.errors.length > 0 && 'bg-red-50/50 dark:bg-red-900/10')}>
                        <td className="p-2 text-xs text-gray-400">{row.row}</td>
                        <td className={cn('p-2 font-medium', row.name ? 'text-gray-900 dark:text-gray-100' : 'text-red-500')}>{row.name || '(vide)'}</td>
                        <td className={cn('p-2 text-right', !isNaN(Number(row.price)) ? 'text-gray-900 dark:text-gray-100' : 'text-red-500')}>{row.price || '-'}</td>
                        <td className={cn('p-2 text-right', row.stock !== '' ? 'text-gray-900 dark:text-gray-100' : 'text-red-500')}>{row.stock || '-'}</td>
                        <td className="p-2 text-gray-600 dark:text-gray-300">{row.category || '-'}</td>
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
                  Les lignes en rouge seront ignorées lors de l'import
                </p>
                <Button size="sm" onClick={handleImport} isLoading={importing}>
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
              <p>1. Téléchargez le <button onClick={downloadTemplate} className="text-brand hover:underline font-medium">template CSV</button></p>
              <p>2. Remplissez les colonnes (les champs marqués * sont obligatoires)</p>
              <p>3. Glissez-déposez votre fichier ou cliquez pour sélectionner</p>
              <p>4. Vérifiez l'aperçu avant d'importer</p>
              <p className="text-xs text-gray-400 mt-2">
                Colonnes obligatoires : <code className="text-brand">name</code>, <code className="text-brand">price</code>, <code className="text-brand">stock</code>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {IMPORT_HISTORY.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aucun import</h3>
              <p className="text-sm text-gray-500">Vous n'avez pas encore importé de produits</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {IMPORT_HISTORY.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', {
                      'bg-emerald-50 text-emerald-600': item.status === 'success',
                      'bg-amber-50 text-amber-600': item.status === 'partial',
                      'bg-red-50 text-red-600': item.status === 'failed',
                    })}>
                      {item.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                       item.status === 'partial' ? <AlertCircle className="h-5 w-5" /> :
                       <X className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.fileName}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.imported}/{item.total} importés
                    </p>
                    {item.errors > 0 && (
                      <p className="text-xs text-red-500">{item.errors} erreur{item.errors > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
