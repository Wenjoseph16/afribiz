'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, QrCode, Users, Loader, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useMenuTables, useCreateMenuTable, useUpdateMenuTable, useDeleteMenuTable, useUpdateMenuTableStatus } from '@/features/hooks';

const STATUS_STYLES: Record<string, string> = {
  FREE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  RESERVED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  OCCUPIED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  CLEANING: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
};

const STATUS_LABELS: Record<string, string> = { FREE: 'Libre', RESERVED: 'Réservée', OCCUPIED: 'Occupée', CLEANING: 'Nettoyage' };
const LOCATIONS = ['Tous', 'SALLE', 'TERRASSE', 'VIP', 'JARDIN', 'BAR'];
const LOCATION_LABELS: Record<string, string> = { SALLE: 'Salle', TERRASSE: 'Terrasse', VIP: 'VIP', JARDIN: 'Jardin', BAR: 'Bar' };

export default function TablesPage() {
  const { data: tablesData, isLoading } = useMenuTables();
  const createTable = useCreateMenuTable();
  const updateTable = useUpdateMenuTable();
  const deleteTable = useDeleteMenuTable();
  const updateTableStatus = useUpdateMenuTableStatus();
  const [filter, setFilter] = useState('Tous');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTable, setEditTable] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', capacity: 4, location: '', status: 'FREE' });

  const tables = Array.isArray(tablesData) ? tablesData : (tablesData?.tables || tablesData?.data || []);
  const filtered = filter === 'Tous' ? tables : tables.filter((t: any) => t.location === filter);

  const openCreate = () => {
    setEditTable(null);
    setForm({ tableNumber: '', capacity: 4, location: '', status: 'FREE' });
    setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditTable(t);
    setForm({ tableNumber: String(t.tableNumber), capacity: t.capacity || 4, location: t.location || '', status: t.status || 'FREE' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.tableNumber) return;
    setSaving(true);
    try {
      if (editTable) {
        await updateTable.mutateAsync({ id: editTable.id, data: {
          tableNumber: form.tableNumber,
          capacity: Number(form.capacity),
          location: form.location || undefined,
          status: form.status,
        } });
      } else {
        await createTable.mutateAsync({
          tableNumber: form.tableNumber,
          capacity: Number(form.capacity),
          location: form.location || undefined,
          status: form.status,
        });
      }
      setModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await deleteTable.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleStatusChange = async (table: any, status: string) => {
    try {
      await updateTableStatus.mutateAsync({ id: table.id, status });
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tables</h1><p className="text-sm text-gray-500">Gérez vos tables</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Ajouter</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[{ label: 'Total', value: tables.length }, { label: 'Libres', value: tables.filter((t: any) => t.status === 'FREE').length, color: 'text-emerald-600' },
          { label: 'Occupées', value: tables.filter((t: any) => t.status === 'OCCUPIED').length, color: 'text-red-600' },
          { label: 'Capacité', value: `${tables.reduce((a: number, t: any) => a + (t.capacity || 0), 0)} pers.` }
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center"><p className={cn('text-xl font-bold text-gray-900 dark:text-white', s.color)}>{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></Card>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {LOCATIONS.map((loc) => (
          <button key={loc} onClick={() => setFilter(loc)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', filter === loc ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>{LOCATION_LABELS[loc] || loc}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((table: any) => (
          <div key={table.id} className={cn('bg-white dark:bg-gray-800 rounded-xl border-2 p-4 hover:shadow-md transition-shadow', STATUS_STYLES[table.status]?.split(' ')[2] || 'border-gray-200 dark:border-gray-700')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">#{table.tableNumber}</span>
              <div className="relative group">
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full cursor-pointer', STATUS_STYLES[table.status]?.split(' ').slice(0,2).join(' ') || 'bg-gray-100 text-gray-600')}>{STATUS_LABELS[table.status] || table.status}</span>
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1 hidden group-hover:block z-10 min-w-[120px]">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => handleStatusChange(table, key)} className={cn('block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600', table.status === key ? 'font-bold text-brand' : 'text-gray-600 dark:text-gray-300')}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <Users className="w-3.5 h-3.5" /><span>{table.capacity} pers.</span>
              {table.location && <span className="ml-auto">{LOCATION_LABELS[table.location] || table.location}</span>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(table)}><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(table)} className="hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTable ? 'Modifier la table' : 'Nouvelle table'}>
        <div className="space-y-4">
          <Input label="Numéro de table *" value={form.tableNumber} onChange={e => setForm(p => ({ ...p, tableNumber: e.target.value }))} placeholder="Ex: 1, A2, Terrasse 3" />
          <Input label="Capacité" type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
          <div>
            <label className="block text-sm font-medium mb-1">Emplacement</label>
            <select value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
              <option value="">Non défini</option>
              {LOCATIONS.filter(l => l !== 'Tous').map(l => <option key={l} value={l}>{LOCATION_LABELS[l]}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving}><Save className="w-4 h-4 mr-1.5" />{editTable ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer la table" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Êtes-vous sûr de vouloir supprimer la table <strong>#{deleteConfirm?.tableNumber}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
