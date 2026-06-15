'use client';

import { useState } from 'react';
import { Clock, Plus, Search, Loader, User, CalendarDays, Save, X, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePlanningSchedules } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function SchedulesPage() {
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employeeName: '', dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: schedulesData, isLoading, refetch } = usePlanningSchedules({ limit: 200 });
  const allSchedules: any[] = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.schedules || schedulesData?.data || []);

  const daySchedules = allSchedules.filter((s: any) => s.dayOfWeek === selectedDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.upsertPlanningSchedule({
        id: editingId || undefined,
        employeeName: form.employeeName,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        isActive: form.isActive,
      });
      setShowCreate(false);
      setEditingId(null);
      setForm({ employeeName: '', dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isActive: true });
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await apiClient.deletePlanningSchedule(id); refetch(); } catch (err) { console.error(err); }
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({ employeeName: s.employeeName || '', dayOfWeek: s.dayOfWeek, startTime: s.startTime || '08:00', endTime: s.endTime || '18:00', isActive: s.isActive ?? true });
    setShowCreate(true);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Horaires & Schedules</h1><p className="text-sm text-gray-500">Gérez les horaires de vos employés et ressources</p></div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm({ employeeName: '', dayOfWeek: selectedDay, startTime: '08:00', endTime: '18:00', isActive: true }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />Nouvel horaire
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Clock className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total horaires</p><p className="text-sm font-bold">{allSchedules.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><User className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Employés</p><p className="text-sm font-bold">{new Set(allSchedules.map((s: any) => s.employeeName)).size}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><CalendarDays className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Jours couverts</p><p className="text-sm font-bold">{new Set(allSchedules.map((s: any) => s.dayOfWeek)).size}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Actifs</p><p className="text-sm font-bold">{allSchedules.filter((s: any) => s.isActive !== false).length}</p></div></div></Card>
      </div>

      {/* Day selector + Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {DAY_LABELS.map((label, i) => (
            <button key={i} onClick={() => setSelectedDay(i + 1)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                selectedDay === i + 1 ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par employé..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Schedule cards */}
      {daySchedules.length === 0 ? (
        <Card className="text-center py-12"><Clock className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun horaire pour ce jour</p></Card>
      ) : (
        <div className="space-y-2">
          {daySchedules.filter((s: any) => !search || (s.employeeName || '').toLowerCase().includes(search.toLowerCase())).map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand/10"><User className="w-5 h-5 text-brand" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.employeeName || 'Employé'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{s.startTime} — {s.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.isActive !== false ? 'success' : 'warning'} size="xs">{s.isActive !== false ? 'Actif' : 'Inactif'}</Badge>
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand"><Clock className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{editingId ? 'Modifier horaire' : 'Nouvel horaire'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employé *</label>
                <input type="text" value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Jour</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  {DAY_LABELS.map((label, i) => <option key={i} value={i + 1}>{label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Début</label>
                  <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fin</label>
                  <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded text-brand focus:ring-brand" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Horaire actif</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" disabled={!form.employeeName} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
