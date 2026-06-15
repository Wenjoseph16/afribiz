'use client';

import { useState } from 'react';
import {
  User, Plus, Pencil, Trash2, Loader, Phone, Truck,
  Save, X, Circle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/features/hooks';

interface DriverForm {
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
}

const emptyForm: DriverForm = { name: '', phone: '', email: '', vehicleType: '', vehiclePlate: '' };

const VEHICLE_TYPES = ['MOTO', 'VOITURE', 'CAMIONNETTE', 'CAMION', 'VELO', 'AUTRE'];

export default function DeliveryDriversPage() {
  const { data: driversData, isLoading, error, refetch } = useDrivers();
  const drivers = Array.isArray(driversData) ? driversData : (driversData?.drivers || driversData?.data || []);
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);

  const createMutation = createDriver;
  const updateMutation = updateDriver;
  const deleteMutation = deleteDriver;

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (driver: any) => {
    setEditingId(driver.id);
    setForm({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
      vehicleType: driver.vehicleType || '',
      vehiclePlate: driver.vehiclePlate || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      vehicleType: form.vehicleType || undefined,
      vehiclePlate: form.vehiclePlate || undefined,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Chauffeurs"
        description="Gérez vos chauffeurs et leurs véhicules"
        breadcrumbs={[{ label: 'Livraisons', href: '/dashboard/deliveries' }, { label: 'Chauffeurs' }]}
        actions={
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Nouveau chauffeur</Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
      ) : drivers.length === 0 ? (
        <Card className="text-center py-12">
          <User className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun chauffeur</h3>
          <p className="text-sm text-gray-500 mb-4">Ajoutez votre premier chauffeur</p>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Nouveau chauffeur</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: any) => (
            <Card key={driver.id} padding="md" className="relative group">
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(driver)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => { if (confirm('Désactiver ce chauffeur ?')) deleteMutation.mutate(driver.id); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/30 flex items-center justify-center shrink-0">
                  <User className="h-6 w-6 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{driver.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{driver.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {driver.email && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="truncate">{driver.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Truck className="h-3.5 w-3.5 shrink-0" />
                  <span>{driver.vehicleType || 'Non spécifié'}</span>
                  {driver.vehiclePlate && <span className="font-mono text-xs text-gray-400">({driver.vehiclePlate})</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Circle className={cn('h-2.5 w-2.5 fill-current',
                  driver.status === 'AVAILABLE' ? 'text-emerald-500' :
                  driver.status === 'BUSY' ? 'text-amber-500' :
                  driver.status === 'OFFLINE' ? 'text-gray-400' : 'text-gray-400'
                )} />
                <span className="text-xs font-medium text-gray-500">
                  {driver.status === 'AVAILABLE' ? 'Disponible' :
                   driver.status === 'BUSY' ? 'En livraison' :
                   driver.status === 'OFFLINE' ? 'Hors ligne' : driver.status || 'Inconnu'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {editingId ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {editingId ? 'Mettez à jour les informations du chauffeur' : 'Ajoutez un chauffeur à votre équipe'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom complet *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Kouamé"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+225 01 02 03 04"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="chauffeur@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de véhicule</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none">
                    <option value="">Sélectionnez</option>
                    {VEHICLE_TYPES.map(vt => (
                      <option key={vt} value={vt}>{vt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Plaque d&apos;immatriculation</label>
                  <input type="text" value={form.vehiclePlate} onChange={e => setForm({ ...form, vehiclePlate: e.target.value })}
                    placeholder="AB-123-CD"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all outline-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSave} isLoading={createMutation.isPending || updateMutation.isPending}
                disabled={!form.name.trim() || !form.phone.trim()}>
                <Save className="h-4 w-4 mr-1.5" />
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
