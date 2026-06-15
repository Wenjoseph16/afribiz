'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers, Plus, Trash2, Edit3, RotateCw, Users,
  ArrowLeft, Check, X, Sparkles, Target,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import {
  useCrmSegments,
  useCrmCreateSegment,
  useCrmUpdateSegment,
  useCrmDeleteSegment,
  useCrmRecalculateSegment,
} from '@/features/crm/hooks';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'];

export default function SegmentsPage() {
  const router = useRouter();
  const { data: segments, isLoading, error } = useCrmSegments();
  const createSegment = useCrmCreateSegment();
  const updateSegment = useCrmUpdateSegment();
  const deleteSegment = useCrmDeleteSegment();
  const recalculateSegment = useCrmRecalculateSegment();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    isDynamic: true,
    conditions: { minOrders: '', minSpent: '', maxSpent: '', lastOrderDays: '' },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#6366f1', isDynamic: true, conditions: { minOrders: '', minSpent: '', maxSpent: '', lastOrderDays: '' } });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (seg: any) => {
    const cond = seg.conditions || {};
    setForm({
      name: seg.name,
      description: seg.description || '',
      color: seg.color,
      isDynamic: seg.isDynamic,
      conditions: {
        minOrders: cond.minOrders?.toString() || '',
        minSpent: cond.minSpent?.toString() || '',
        maxSpent: cond.maxSpent?.toString() || '',
        lastOrderDays: cond.lastOrderDays?.toString() || '',
      },
    });
    setEditingId(seg.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const conditions: Record<string, any> = {};
    if (form.conditions.minOrders) conditions.minOrders = Number(form.conditions.minOrders);
    if (form.conditions.minSpent) conditions.minSpent = Number(form.conditions.minSpent);
    if (form.conditions.maxSpent) conditions.maxSpent = Number(form.conditions.maxSpent);
    if (form.conditions.lastOrderDays) conditions.lastOrderDays = Number(form.conditions.lastOrderDays);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      color: form.color,
      conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
      isDynamic: form.isDynamic,
    };

    if (editingId) {
      await updateSegment.mutateAsync({ segmentId: editingId, data: payload });
    } else {
      await createSegment.mutateAsync(payload);
    }
    resetForm();
  };

  if (isLoading) return <Loader variant="spinner" size="lg" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Segments CRM"
        description="Créez et gérez des segments de clients pour mieux cibler vos actions"
        gradient
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/clients')}>
              <Users className="h-4 w-4" /> Voir les clients
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Nouveau segment
            </Button>
          </div>
        }
      />

      {/* Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {editingId ? 'Modifier le segment' : 'Nouveau segment'}
            </h3>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
              <input
                type="text" placeholder="Ex: VIP, Nouveaux, Inactifs..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Couleur</label>
              <div className="flex gap-2 items-center">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <input
                type="text" placeholder="Description du segment..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium',
                  form.isDynamic ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {form.isDynamic ? 'DYNAMIQUE' : 'MANUEL'}
                </span>
                Segment dynamique (auto-calculé)
                <input
                  type="checkbox"
                  checked={form.isDynamic}
                  onChange={(e) => setForm({ ...form, isDynamic: e.target.checked })}
                  className="rounded"
                />
              </label>
            </div>

            {/* Conditions (only if dynamic) */}
            {form.isDynamic && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min. commandes</label>
                  <input
                    type="number" placeholder="3"
                    value={form.conditions.minOrders}
                    onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, minOrders: e.target.value } })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min. dépensé (FCFA)</label>
                  <input
                    type="number" placeholder="50000"
                    value={form.conditions.minSpent}
                    onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, minSpent: e.target.value } })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max. dépensé (FCFA)</label>
                  <input
                    type="number" placeholder="200000"
                    value={form.conditions.maxSpent}
                    onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, maxSpent: e.target.value } })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dernière commande (jours)</label>
                  <input
                    type="number" placeholder="30"
                    value={form.conditions.lastOrderDays}
                    onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, lastOrderDays: e.target.value } })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.name || createSegment.isPending || updateSegment.isPending}>
              <Check className="h-4 w-4" />
              {editingId ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </Card>
      )}

      {/* Segments list */}
      {segments?.length === 0 && !showForm ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="Aucun segment"
          description="Créez votre premier segment pour organiser vos clients. Vous pouvez définir des conditions automatiques ou assigner manuellement."
          action={
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Créer un segment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments?.map((seg: any) => (
            <Card key={seg.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: seg.color + '20' }}>
                    <Target className="h-5 w-5" style={{ color: seg.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{seg.name}</h3>
                    <span className={cn(
                      'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5',
                      seg.isDynamic ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      {seg.isDynamic ? 'Dynamique' : 'Manuel'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(seg)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Supprimer ce segment ?')) deleteSegment.mutate(seg.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
              {seg.description && (
                <p className="text-xs text-gray-500 mb-3">{seg.description}</p>
              )}
              {seg.conditions && seg.isDynamic && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {seg.conditions.minOrders && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      ≥{seg.conditions.minOrders} commandes
                    </span>
                  )}
                  {seg.conditions.minSpent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      ≥{Number(seg.conditions.minSpent).toLocaleString()} FCFA
                    </span>
                  )}
                  {seg.conditions.lastOrderDays && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      &lt;{seg.conditions.lastOrderDays} jours
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{seg._count?.clients || 0}</span>
                  clients
                </div>
                {seg.isDynamic && (
                  <button
                    onClick={() => recalculateSegment.mutate(seg.id)}
                    disabled={recalculateSegment.isPending}
                    className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 font-medium"
                  >
                    <RotateCw className={cn('h-3 w-3', recalculateSegment.isPending && 'animate-spin')} />
                    Recalculer
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
