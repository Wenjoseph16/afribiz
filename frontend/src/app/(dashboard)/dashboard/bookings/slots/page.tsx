'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Clock, Sun, Loader, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useBookingSlots, useBookingResources } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const SLOTS_URL = '/business/bookings/slots';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function SlotsPage() {
  const qc = useQueryClient();
  const { data: slotsData, isLoading } = useBookingSlots();
  const { data: resourcesData } = useBookingResources();
  const slots = Array.isArray(slotsData) ? slotsData : (slotsData?.items || slotsData?.data || []);
  const resources = Array.isArray(resourcesData) ? resourcesData : (resourcesData?.items || resourcesData?.data || []);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [editSlot, setEditSlot] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: selectedDay, startTime: '08:00', endTime: '18:00', resourceId: '', slotDuration: 30, bufferTime: 0, maxCapacity: 1 });

  const daySlots = slots.filter((s: any) => s.dayOfWeek === selectedDay);

  const openCreate = () => {
    setEditSlot(null);
    setForm({ dayOfWeek: selectedDay, startTime: '08:00', endTime: '18:00', resourceId: '', slotDuration: 30, bufferTime: 0, maxCapacity: 1 });
    setModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditSlot(s);
    setForm({
      dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime,
      resourceId: s.resourceId || '', slotDuration: s.slotDuration || 30,
      bufferTime: s.bufferTime || 0, maxCapacity: s.maxCapacity || 1,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editSlot) {
        await apiClient.put(`${SLOTS_URL}/${editSlot.id}`, {
          dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime,
          resourceId: form.resourceId || null, slotDuration: Number(form.slotDuration),
          bufferTime: Number(form.bufferTime), maxCapacity: Number(form.maxCapacity),
        });
      } else {
        await apiClient.post(SLOTS_URL, {
          dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime,
          resourceId: form.resourceId || undefined, slotDuration: Number(form.slotDuration),
          bufferTime: Number(form.bufferTime), maxCapacity: Number(form.maxCapacity),
        });
      }
      qc.invalidateQueries({ queryKey: ['biz-bookings', 'slots'] });
      setModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await apiClient.delete(`${SLOTS_URL}/${deleteConfirm.id}`);
      qc.invalidateQueries({ queryKey: ['biz-bookings', 'slots'] });
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
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créneaux horaires</h1><p className="text-sm text-gray-500">Définissez vos plages de réservation</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Ajouter un créneau</Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {DAYS.map((day, i) => (
          <button key={i} onClick={() => { setSelectedDay(i); }} className={cn('px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', selectedDay === i ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>{day}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: 'Créneaux', value: daySlots.length }, { label: 'Jour', value: DAYS[selectedDay] },
          { label: 'Début', value: daySlots.length > 0 ? daySlots.reduce((a: any, s: any) => s.startTime < a ? s.startTime : a, '23:59') : '—' },
          { label: 'Fin', value: daySlots.length > 0 ? daySlots.reduce((a: any, s: any) => s.endTime > a ? s.endTime : a, '00:00') : '—' },
        ].map(s => <Card key={s.label} className="p-3 text-center"><p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></Card>)}
      </div>

      <div className="space-y-3">
        {daySlots.length === 0 && (
          <Card className="p-12 text-center">
            <Sun className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun créneau pour {DAYS[selectedDay]}</p>
            <p className="text-xs text-gray-400 mt-1">Ajoutez des créneaux pour ce jour</p>
          </Card>
        )}
        {daySlots.map((slot: any) => (
          <Card key={slot.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-brand/10"><Clock className="w-5 h-5 text-brand" /></div>
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <span>{slot.startTime}</span><span className="text-gray-300">→</span><span>{slot.endTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>Capacité: {slot.maxCapacity}</span>
                    {slot.slotDuration && <span>Créneaux de {slot.slotDuration}min</span>}
                    {slot.bufferTime > 0 && <span>Pause {slot.bufferTime}min</span>}
                    {slot.resource && <span>• {slot.resource.name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(slot)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(slot)} className="hover:text-red-500"><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSlot ? 'Modifier le créneau' : 'Nouveau créneau'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jour</label>
              <select value={form.dayOfWeek} onChange={e => setForm(p => ({ ...p, dayOfWeek: Number(e.target.value) }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ressource</label>
              <select value={form.resourceId} onChange={e => setForm(p => ({ ...p, resourceId: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                <option value="">Toutes</option>
                {resources.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <Input label="Heure début" type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
            <Input label="Heure fin" type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
            <Input label="Durée créneau (min)" type="number" min={5} value={form.slotDuration} onChange={e => setForm(p => ({ ...p, slotDuration: Number(e.target.value) }))} />
            <Input label="Pause (min)" type="number" min={0} value={form.bufferTime} onChange={e => setForm(p => ({ ...p, bufferTime: Number(e.target.value) }))} />
            <Input label="Capacité max" type="number" min={1} value={form.maxCapacity} onChange={e => setForm(p => ({ ...p, maxCapacity: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving}><Save className="w-4 h-4 mr-1.5" />{editSlot ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer le créneau" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Supprimer le créneau <strong>{deleteConfirm?.startTime} - {deleteConfirm?.endTime}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
