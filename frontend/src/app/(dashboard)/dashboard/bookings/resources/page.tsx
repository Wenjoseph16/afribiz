'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, User, DoorOpen, Car, Table2, Loader, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useBookingResources } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const RESOURCE_URL = '/business/bookings/resources';

const RESOURCE_ICONS: Record<string, any> = { ROOM: DoorOpen, EMPLOYEE: User, EQUIPMENT: DoorOpen, VEHICLE: Car, SPACE: DoorOpen, TABLE: Table2 };
const RESOURCE_TYPES = ['Tous','ROOM','EMPLOYEE','EQUIPMENT','VEHICLE','SPACE','TABLE'];
const TYPE_LABELS: Record<string, string> = { ROOM: 'Salle', EMPLOYEE: 'Employé', EQUIPMENT: 'Équipement', VEHICLE: 'Véhicule', SPACE: 'Espace', TABLE: 'Table' };

export default function ResourcesPage() {
  const qc = useQueryClient();
  const { data: resourcesData, isLoading } = useBookingResources();
  const resources = Array.isArray(resourcesData) ? resourcesData : (resourcesData?.items || resourcesData?.data || []);
  const [filter, setFilter] = useState('Tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [editResource, setEditResource] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ROOM' as string, capacity: 1, description: '' });

  const filtered = filter === 'Tous' ? resources : resources.filter((r: any) => r.type === filter);

  const openCreate = () => { setEditResource(null); setForm({ name: '', type: 'ROOM', capacity: 1, description: '' }); setModalOpen(true); };
  const openEdit = (r: any) => { setEditResource(r); setForm({ name: r.name, type: r.type, capacity: r.capacity || 1, description: r.description || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editResource) {
        await apiClient.put(`${RESOURCE_URL}/${editResource.id}`, { name: form.name, type: form.type, capacity: Number(form.capacity), description: form.description || undefined });
      } else {
        await apiClient.post(RESOURCE_URL, { name: form.name, type: form.type, capacity: Number(form.capacity), description: form.description || undefined });
      }
      qc.invalidateQueries({ queryKey: ['biz-bookings', 'resources'] });
      setModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await apiClient.delete(`${RESOURCE_URL}/${deleteConfirm.id}`);
      qc.invalidateQueries({ queryKey: ['biz-bookings', 'resources'] });
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ressources réservables</h1><p className="text-sm text-gray-500">Salles, employés, équipements...</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Nouvelle ressource</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: 'Total', value: resources.length }, { label: 'Salles', value: resources.filter((r: any) => r.type === 'ROOM').length },
          { label: 'Employés', value: resources.filter((r: any) => r.type === 'EMPLOYEE').length },
          { label: 'Équipements', value: resources.filter((r: any) => r.type === 'EQUIPMENT').length },
        ].map(s => <Card key={s.label} className="p-3 text-center"><p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></Card>)}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {RESOURCE_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', filter === t ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>{t === 'Tous' ? 'Tous' : TYPE_LABELS[t] || t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res: any) => {
          const Icon = RESOURCE_ICONS[res.type] || User;
          return (
            <Card key={res.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-brand/10"><Icon className="w-5 h-5 text-brand" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{res.name}</h3>
                  <p className="text-xs text-gray-400">{TYPE_LABELS[res.type] || res.type}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Capacité: {res.capacity} pers.</span>
                    {res._count && <span>{res._count.bookings || res.bookingsCount || 0} résa.</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(res)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(res)} className="hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 text-sm">Aucune ressource trouvée</div>}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editResource ? 'Modifier la ressource' : 'Nouvelle ressource'}>
        <div className="space-y-4">
          <Input label="Nom *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Salle de réunion, Jean..." />
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
              {RESOURCE_TYPES.filter(t => t !== 'Tous').map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <Input label="Capacité" type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving}><Save className="w-4 h-4 mr-1.5" />{editResource ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer la ressource" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm?.name}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
