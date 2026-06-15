'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useAdvancedTask, useUpdateAdvancedTask, useTaskCategories } from '@/features/hooks';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: task, isLoading, isError } = useAdvancedTask(id);
  const { data: categories } = useTaskCategories();
  const updateMutation = useUpdateAdvancedTask();

  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState({
    info: true, affectation: false, planification: false,
    liaison: false, qualite: false, checklist: false, notes: false,
  });
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', priority: 'MEDIUM',
    assigneeId: '', assignedTo: '', partnerId: '',
    startDate: '', dueDate: '', estimatedHours: '', recurrence: '',
    orderId: '', bookingId: '', deliveryId: '', eventId: '', rentalId: '',
    requiresValidation: false, requiresPhoto: false, requiresSignature: false,
    checklistItems: [] as { id?: string; label: string; completedAt: string | null }[],
    notes: '',
  });
  const [newCheckItem, setNewCheckItem] = useState('');

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!task) return;
    const toLocal = (d: string) => d ? d.replace('Z', '').slice(0, 16) : '';
    setForm({
      title: task.title || '',
      description: task.description || '',
      categoryId: task.categoryId || '',
      priority: task.priority || 'MEDIUM',
      assigneeId: task.assigneeId || '',
      assignedTo: task.assignedTo || '',
      partnerId: task.partnerId || '',
      startDate: toLocal(task.startDate),
      dueDate: toLocal(task.dueDate),
      estimatedHours: task.estimatedHours?.toString() || '',
      recurrence: task.recurrence || '',
      orderId: task.orderId || '',
      bookingId: task.bookingId || '',
      deliveryId: task.deliveryId || '',
      eventId: task.eventId || '',
      rentalId: task.rentalId || '',
      requiresValidation: task.requiresValidation ?? false,
      requiresPhoto: task.requiresPhoto ?? false,
      requiresSignature: task.requiresSignature ?? false,
      checklistItems: task.checklists?.map((c: any) => ({ id: c.id, label: c.label, completedAt: c.completedAt })) || [],
      notes: task.notes || '',
    });
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...form,
          estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        },
      });
      router.push(`/dashboard/tasks/${id}`);
    } catch {
      setSaving(false);
    }
  }

  function addChecklistItem() {
    if (newCheckItem.trim()) {
      set('checklistItems', [...form.checklistItems, { label: newCheckItem.trim(), completedAt: null }]);
      setNewCheckItem('');
    }
  }

  function toggleSection(key: keyof typeof sections) {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function Section({ title, section, children }: { title: string; section: keyof typeof sections; children: React.ReactNode }) {
    const open = sections[section];
    return (
      <Card className="p-0 overflow-hidden">
        <button type="button" onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">{children}</div>}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (isError || !task) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Modifier la tâche"
        description="Mettez à jour les informations de la tâche"
        gradient
        actions={
          <Link href={`/dashboard/tasks/${id}`}>
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <Section title="1. Informations principales" section="info">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Préparer commande #123" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="Décrivez la tâche en détail..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm">
                <option value="">Sélectionner...</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priorité</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm">
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Normale</option>
                <option value="HIGH">Élevée</option>
                <option value="URGENT">Critique</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="2. Affectation" section="affectation">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID Assigné</label>
              <Input value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} placeholder="ID de l'assigné" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigné à</label>
              <Input value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Nom de l'assigné" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partenaire ID</label>
              <Input value={form.partnerId} onChange={(e) => set('partnerId', e.target.value)} placeholder="ID partenaire" />
            </div>
          </div>
        </Section>

        <Section title="3. Planification" section="planification">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date début</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date échéance</label>
              <input type="datetime-local" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée estimée (heures)</label>
              <input type="number" value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} min="0" step="0.5"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Récurrence</label>
              <select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm">
                <option value="">Aucune</option>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
                <option value="yearly">Annuelle</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="4. Liaison système" section="liaison">
          <p className="text-xs text-gray-500">Lie cette tâche à une commande, réservation ou livraison existante</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Commande ID</label>
              <Input value={form.orderId} onChange={(e) => set('orderId', e.target.value)} placeholder="ID commande" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Réservation ID</label>
              <Input value={form.bookingId} onChange={(e) => set('bookingId', e.target.value)} placeholder="ID réservation" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Livraison ID</label>
              <Input value={form.deliveryId} onChange={(e) => set('deliveryId', e.target.value)} placeholder="ID livraison" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Événement ID</label>
              <Input value={form.eventId} onChange={(e) => set('eventId', e.target.value)} placeholder="ID événement" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Location ID</label>
              <Input value={form.rentalId} onChange={(e) => set('rentalId', e.target.value)} placeholder="ID location" />
            </div>
          </div>
        </Section>

        <Section title="5. Ressources & Contrôle qualité" section="qualite">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input type="checkbox" checked={form.requiresValidation} onChange={(e) => set('requiresValidation', e.target.checked)} className="rounded" />
            <span className="text-sm">Nécessite une validation manager</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input type="checkbox" checked={form.requiresPhoto} onChange={(e) => set('requiresPhoto', e.target.checked)} className="rounded" />
            <span className="text-sm">Photo preuve requise</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <input type="checkbox" checked={form.requiresSignature} onChange={(e) => set('requiresSignature', e.target.checked)} className="rounded" />
            <span className="text-sm">Signature requise</span>
          </label>
        </Section>

        <Section title="6. Checklist" section="checklist">
          {form.checklistItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className={cn('text-sm flex-1', item.completedAt && 'line-through text-gray-400')}>{item.label}</span>
              <button type="button" onClick={() => set('checklistItems', form.checklistItems.filter((_, j) => j !== i))}
                className="text-red-500 text-xs hover:text-red-700">Supprimer</button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
              placeholder="Ajouter une étape..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())} />
            <Button type="button" variant="outline" onClick={addChecklistItem}>Ajouter</Button>
          </div>
        </Section>

        <Section title="7. Notes" section="notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={5}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="Notes internes sur la tâche..." />
        </Section>

        <div className="flex items-center justify-between pt-2">
          <Link href={`/dashboard/tasks/${id}`}>
            <Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Annuler</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
