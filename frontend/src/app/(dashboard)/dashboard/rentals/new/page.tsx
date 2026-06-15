'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Car, Upload, X, Image as ImageIcon, Tag, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateRental } from '@/features/hooks';
import Image from 'next/image';
import { useNotifyError } from '@/hooks/useNotifyError';

const PRICE_UNITS = ['day', 'hour', 'week', 'month', 'piece'] as const;

export default function NewRentalPage() {
  const router = useRouter();
  const createRental = useCreateRental();

  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: '',
    deposit: '', priceUnit: 'day', currency: 'FCFA',
    quantity: '1', images: [] as string[],
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createRental.mutateAsync({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        unit: form.unit,
        deposit: form.deposit ? parseFloat(form.deposit) : undefined,
        priceUnit: form.priceUnit,
        currency: form.currency,
        quantity: parseInt(form.quantity),
        images: form.images.length > 0 ? form.images : undefined,
      });
      router.push('/dashboard/rentals');
    } catch (err) { notifyError(err, 'Erreur', "Impossible de créer l'article de location"); }
  };

  const notifyError = useNotifyError();

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouvel article en location" description="Ajoutez un article ou équipement à louer"
        breadcrumbs={[{ label: 'Locations', href: '/dashboard/rentals' }, { label: 'Nouveau' }]}
        actions={<Link href="/dashboard/rentals"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand" />
              Informations de base
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'article *</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
                placeholder="Ex: Chaise pliante, Vélo tout terrain, Tente 4 places..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Description détaillée de l'article, état, caractéristiques..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          {/* Tarification */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand" />
              Tarification
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix * ({form.currency})</label>
                <input type="number" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité de prix</label>
                <select value={form.priceUnit} onChange={e => update('priceUnit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                  {PRICE_UNITS.map(u => <option key={u} value={u}>{u === 'day' ? 'Jour' : u === 'hour' ? 'Heure' : u === 'week' ? 'Semaine' : u === 'month' ? 'Mois' : 'Pièce'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caution (optionnelle)</label>
                <input type="number" step="0.01" value={form.deposit} onChange={e => update('deposit', e.target.value)}
                  placeholder="Montant de la caution"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité disponible</label>
                <input type="number" min="1" value={form.quantity} onChange={e => update('quantity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
              </div>
            </div>
          </div>

          {/* Unité */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand" />
              Unité
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d'unité (ex: chaise, vélo, tente)</label>
              <input type="text" value={form.unit} onChange={e => update('unit', e.target.value)}
                placeholder="ex: chaise, vélo, tente, appareil photo"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand" />
              Photos de l'article
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                  <Image src={img} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" unoptimized />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = form.images.filter((_, idx) => idx !== i);
                      setForm(f => ({ ...f, images: newImages }));
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.images.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-all group">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-brand transition-colors">Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && form.images.length < 5) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          setForm(f => ({ ...f, images: [...f.images, dataUrl] }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            {form.images.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Ajoutez jusqu'à 5 photos de votre article (optionnel)</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard/rentals"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createRental.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createRental.isPending ? 'Création...' : "Créer l'article"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
