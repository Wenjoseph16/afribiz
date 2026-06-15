'use client';

import { useState } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, Loader, DollarSign, Clock,
  Save, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useDeliveryZones, useCreateDeliveryZone, useUpdateDeliveryZone, useDeleteDeliveryZone } from '@/features/hooks';

interface ZoneForm {
  name: string;
  fee: string;
  minOrder: string;
  estimatedTime: string;
  isActive: boolean;
}

const emptyForm: ZoneForm = { name: '', fee: '', minOrder: '', estimatedTime: '', isActive: true };

export default function DeliveryZonesPage() {
  const { data: zonesData, isLoading, error, refetch } = useDeliveryZones();
  const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || zonesData?.data || []);
  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);

  const createMutation = createZone;
  const updateMutation = updateZone;
  const deleteMutation = deleteZone;

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (zone: any) => {
    setEditingId(zone.id);
    setForm({
      name: zone.name || '',
      fee: zone.fee?.toString() || '',
      minOrder: zone.minOrder?.toString() || '',
      estimatedTime: zone.estimatedTime?.toString() || '',
      isActive: zone.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload: any = { name: form.name, isActive: form.isActive };
    if (form.fee) payload.fee = parseFloat(form.fee);
    if (form.minOrder) payload.minOrder = parseFloat(form.minOrder);
    if (form.estimatedTime) payload.estimatedTime = parseInt(form.estimatedTime, 10);
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Zones de livraison"
        description="Gérez les zones, frais et délais de livraison"
        breadcrumbs={[{ label: 'Livraisons', href: '/dashboard/deliveries' }, { label: 'Zones' }]}
        actions={
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Nouvelle zone</Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
      ) : zones.length === 0 ? (
        <Card className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune zone</h3>
          <p className="text-sm text-gray-500 mb-4">Créez votre première zone de livraison</p>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Nouvelle zone</Button>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Frais</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Commande min.</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Temps estimé</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {zones.map((zone: any) => (
                  <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4 text-brand" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <DollarSign className="h-3.5 w-3.5" />
                        {zone.fee ? `${Number(zone.fee).toLocaleString()} FCFA` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {zone.minOrder ? `${Number(zone.minOrder).toLocaleString()} FCFA` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {zone.estimatedTime ? (
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Clock className="h-3.5 w-3.5" />
                          {zone.estimatedTime} min
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                        zone.isActive !== false
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'text-gray-500 bg-gray-100 dark:bg-gray-700'
                      )}>
                        {zone.isActive !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(zone)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => { if (confirm('Supprimer cette zone ?')) deleteMutation.mutate(zone.id); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {editingId ? 'Modifier la zone' : 'Nouvelle zone'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {editingId ? 'Mettez à jour les informations de la zone' : 'Créez une nouvelle zone de livraison'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Zone A, Abidjan Nord..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frais (FCFA)</label>
                  <input type="number" min={0} value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })}
                    placeholder="2000"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Commande min.</label>
                  <input type="number" min={0} value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="5000"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Temps estimé (minutes)</label>
                <input type="number" min={0} value={form.estimatedTime} onChange={e => setForm({ ...form, estimatedTime: e.target.value })}
                  placeholder="30"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/20" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zone active</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSave} isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={!form.name.trim()}>
                <Save className="h-4 w-4 mr-1.5" />
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
