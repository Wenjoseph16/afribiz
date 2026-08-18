'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Save,
  ArrowLeft,
  Plus,
  ScanBarcode,
  Mic,
  Layers,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Repeater } from '@/components/formkit/Repeater';
import { BarcodeScanner } from '@/components/formkit/BarcodeScanner';
import { VoiceInput } from '@/components/formkit/VoiceInput';
import { MoneyInput } from '@/components/formkit/MoneyInput';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';

interface ProductLine {
  name: string;
  price: number;
  stock: number;
  barcode: string;
  sku: string;
  unit: string;
  categoryId: string;
  images: string[];
}

const DEFAULT_LINE: ProductLine = {
  name: '',
  price: 0,
  stock: 1,
  barcode: '',
  sku: '',
  unit: 'piece',
  categoryId: '',
  images: [],
};

/**
 * Chantier 8 — Inventaire Express 📸
 * Formulaire express pour remplir le stock en minutes.
 * Modes : lots (Repeater), scan code-barres, saisie vocale.
 * Zéro saisie lourde — un seul formulaire réutilisable.
 */
export default function ExpressInventoryPage() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<ProductLine[]>([{ ...DEFAULT_LINE }]);
  const [activeMode, setActiveMode] = useState<'batch' | 'scan' | 'voice'>('batch');

  // Charger les catégories
  const { data: categoriesData } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => apiClient.getProductCategories(),
  });
  const categories = (categoriesData as any)?.data?.data || [];

  // Mutation batch create
  const createMutation = useMutation({
    mutationFn: async (products: ProductLine[]) => {
      const results = await Promise.allSettled(
        products
          .filter((p) => p.name.trim() && p.price > 0)
          .map((p) =>
            apiClient.createProduct({
              name: p.name,
              price: p.price,
              stock: p.stock,
              barcode: p.barcode || undefined,
              sku: p.sku || undefined,
              unit: p.unit,
              categoryId: p.categoryId || undefined,
              images: p.images,
            })
          )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { succeeded, failed, total: products.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      notify({
        title: 'Inventaire enregistré',
        description: `${result.succeeded}/${result.total} produits créés${
          result.failed > 0 ? ` (${result.failed} échec(s))` : ''
        }`,
        variant: 'success',
      });
      setLines([{ ...DEFAULT_LINE }]);
    },
    onError: (err: any) => {
      notify({
        title: 'Erreur',
        description: err.message || 'Erreur lors de la création',
        variant: 'error',
      });
    },
  });

  const handleSave = () => {
    const validLines = lines.filter((l) => l.name.trim() && l.price > 0);
    if (validLines.length === 0) {
      notify({
        title: 'Aucun produit valide',
        description: 'Ajoutez au moins un produit avec un nom et un prix',
        variant: 'error',
      });
      return;
    }
    createMutation.mutate(validLines);
  };

  /** Callback quand le scanner code-barres détecte un code */
  const handleBarcodeDetected = useCallback(
    async (code: string) => {
      // Lookup dans la base partagée
      try {
        const res = await apiClient.lookupBarcode(code);
        const data = (res as any)?.data?.data;
        if (data?.found) {
          // Pré-remplir la première ligne vide
          const emptyIndex = lines.findIndex((l) => !l.name.trim());
          const newLine: ProductLine = {
            name: data.name || '',
            price: data.price || 0,
            stock: 1,
            barcode: code,
            sku: data.sku || '',
            unit: data.unit || 'piece',
            categoryId: data.category?.id || '',
            images: data.images || [],
          };
          if (emptyIndex >= 0) {
            const updated = [...lines];
            updated[emptyIndex] = newLine;
            setLines(updated);
          } else {
            setLines([...lines, newLine]);
          }
          notify({
            title: 'Produit trouvé',
            description: `${data.name} — ${data.price} ${data.currency}`,
            variant: 'success',
          });
        } else {
          // Pas trouvé — ajouter une ligne avec le code-barres pré-rempli
          setLines([...lines, { ...DEFAULT_LINE, barcode: code }]);
          notify({
            title: 'Code-barres inconnu',
            description: `Code ${code} ajouté — complétez manuellement`,
            variant: 'info',
          });
        }
      } catch {
        setLines([...lines, { ...DEFAULT_LINE, barcode: code }]);
      }
    },
    [lines, notify]
  );

  const updateLine = (index: number, patch: Partial<ProductLine>) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], ...patch };
    setLines(updated);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const validCount = lines.filter((l) => l.name.trim() && l.price > 0).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inventaire Express"
        description="Remplissez votre stock en minutes — scan, voix, ou saisie rapide"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Produits', href: '/dashboard/products' },
          { label: 'Inventaire Express' },
        ]}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Retour
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={createMutation.isPending}
              disabled={validCount === 0}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Tout enregistrer ({validCount})
            </Button>
          </div>
        }
      />

      {/* Mode selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 flex">
        <button
          onClick={() => setActiveMode('batch')}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5',
            activeMode === 'batch'
              ? 'bg-brand text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <Layers className="h-4 w-4" />
          Mode lots
        </button>
        <button
          onClick={() => setActiveMode('scan')}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5',
            activeMode === 'scan'
              ? 'bg-brand text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <ScanBarcode className="h-4 w-4" />
          Scanner
        </button>
        <button
          onClick={() => setActiveMode('voice')}
          className={cn(
            'flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5',
            activeMode === 'voice'
              ? 'bg-brand text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
        >
          <Mic className="h-4 w-4" />
          Voix
        </button>
      </div>

      {/* Scanner mode */}
      {activeMode === 'scan' && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <ScanBarcode className="h-5 w-5 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Scanner un code-barres
              </h3>
              <p className="text-xs text-gray-500">
                Le produit sera automatiquement ajouté à la liste
              </p>
            </div>
          </div>
          <BarcodeScanner onDetected={handleBarcodeDetected} />
        </Card>
      )}

      {/* Voice mode */}
      {activeMode === 'voice' && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Mic className="h-5 w-5 text-brand" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Saisie vocale
              </h3>
              <p className="text-xs text-gray-500">
                Dites le nom du produit, puis appuyez sur Entrée
              </p>
            </div>
          </div>
          <VoiceInput
            label="Nom du produit"
            placeholder="Dites le nom du produit…"
            onConfirm={(value) => {
              setLines([...lines, { ...DEFAULT_LINE, name: value }]);
              notify({
                title: 'Produit ajouté',
                description: `"${value}" — complétez le prix et le stock`,
                variant: 'success',
              });
            }}
          />
        </Card>
      )}

      {/* Product lines — Repeater */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Produits ({lines.length})
          </h3>
          <span className="text-xs text-gray-400">
            {validCount} valide{validCount > 1 ? 's' : ''}
          </span>
        </div>

        <Repeater
          items={lines}
          onChange={setLines}
          makeNew={() => ({ ...DEFAULT_LINE })}
          addLabel="Ajouter un produit"
          renderItem={(line, index, update) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nom */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={line.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Ex: Tissu Wax Africain"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                />
              </div>

              {/* Prix */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Prix (FCFA) *
                </label>
                <MoneyInput
                  value={line.price}
                  onChange={(val) => update({ price: val })}
                  placeholder="0"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                <input
                  type="number"
                  min={0}
                  value={line.stock}
                  onChange={(e) => update({ stock: Number(e.target.value) })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                />
              </div>

              {/* Code-barres */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Code-barres</label>
                <input
                  type="text"
                  value={line.barcode}
                  onChange={(e) => update({ barcode: e.target.value })}
                  placeholder="Optionnel"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all font-mono"
                />
              </div>

              {/* Unité */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Unité</label>
                <select
                  value={line.unit}
                  onChange={(e) => update({ unit: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                >
                  <option value="piece">Pièce</option>
                  <option value="kg">Kilogramme</option>
                  <option value="g">Gramme</option>
                  <option value="l">Litre</option>
                  <option value="ml">Millilitre</option>
                  <option value="m">Mètre</option>
                  <option value="carton">Carton</option>
                  <option value="lot">Lot</option>
                </select>
              </div>
            </div>
          )}
        />
      </Card>

      {/* Save button (mobile) */}
      <div className="sticky bottom-4 sm:hidden">
        <Button
          onClick={handleSave}
          isLoading={createMutation.isPending}
          disabled={validCount === 0}
          className="w-full shadow-lg"
          size="lg"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Tout enregistrer ({validCount} produits)
        </Button>
      </div>
    </div>
  );
}
