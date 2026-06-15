'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Info, UserCheck, Calendar, Link2, ClipboardList, CheckSquare, FileText, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useTaskCategories, useCreateAdvancedTask } from '@/features/hooks';

const sections = [
  { key: 'info', label: 'Informations principales', icon: Info },
  { key: 'affectation', label: 'Affectation', icon: UserCheck },
  { key: 'planning', label: 'Planification', icon: Calendar },
  { key: 'liaison', label: 'Liaison système', icon: Link2 },
  { key: 'ressources', label: 'Ressources & Contrôle qualité', icon: ClipboardList },
  { key: 'checklist', label: 'Checklist', icon: CheckSquare },
  { key: 'notes', label: 'Notes', icon: FileText },
] as const;

const priorityOptions = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Normale' },
  { value: 'HIGH', label: 'Élevée' },
  { value: 'URGENT', label: 'Critique' },
];

const recurrenceOptions = [
  { value: 'NONE', label: 'Aucune' },
  { value: 'DAILY', label: 'Quotidienne' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'MONTHLY', label: 'Mensuelle' },
];

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function NewTaskPage() {
  const router = useRouter();
  const { data: categories } = useTaskCategories();
  const createTask = useCreateAdvancedTask();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    info: true, affectation: false, planning: false, liaison: false,
    ressources: false, checklist: false, notes: false,
  });

  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', priority: 'MEDIUM',
    assigneeId: '', assignedTo: '', partnerId: '',
    startDate: '', dueDate: '', estimatedHours: '', recurrence: 'NONE',
    orderId: '', bookingId: '', deliveryId: '', eventId: '', rentalId: '',
    requiresValidation: false, requiresPhoto: false, requiresSignature: false,
    resources: [] as { label: string; url: string }[],
    checklistItems: [] as string[],
    notes: '',
  });

  const [newCheckItem, setNewCheckItem] = useState('');
  const [newResourceLabel, setNewResourceLabel] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  function toggleSection(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function addChecklistItem() {
    if (newCheckItem.trim()) {
      set('checklistItems', [...form.checklistItems, newCheckItem.trim()]);
      setNewCheckItem('');
    }
  }

  function addResource() {
    if (newResourceLabel.trim() && newResourceUrl.trim()) {
      set('resources', [...form.resources, { label: newResourceLabel.trim(), url: newResourceUrl.trim() }]);
      setNewResourceLabel('');
      setNewResourceUrl('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const res = await createTask.mutateAsync(form);
      router.push(`/dashboard/tasks/${res.data.data.id}`);
    } catch (e) { console.error(e); }
  }

  function renderSectionHeader(key: string, label: string, Icon: any) {
    const open = expanded[key];
    return (
      <div
        onClick={() => toggleSection(key)}
        className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center gap-3 cursor-pointer select-none"
      >
        <Icon className="h-5 w-5 text-brand shrink-0" />
        <span className="font-semibold text-gray-900 dark:text-gray-100 flex-1">{label}</span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Nouvelle tâche"
        description="Créez une tâche et assignez-la à votre équipe"
        gradient
        actions={
          <Link href="/dashboard/tasks"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Retour</Button></Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Section 1: Informations principales */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('info', 'Informations principales', Info)}
          {expanded.info && (
            <div className="pt-4 space-y-4 p-5">
              <div>
                <label className={labelClass}>Titre *</label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex: Préparer commande #123"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Décrivez la tâche en détail..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Catégorie</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => set('priority', e.target.value)}
                    className={inputClass}
                  >
                    {priorityOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Affectation */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('affectation', 'Affectation', UserCheck)}
          {expanded.affectation && (
            <div className="pt-4 space-y-4 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Employé assigné" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} placeholder="ID employé" />
                <Input label="Équipe" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Nom de l'équipe" />
              </div>
              <Input label="Partenaire externe" value={form.partnerId} onChange={(e) => set('partnerId', e.target.value)} placeholder="ID partenaire" />
            </div>
          )}
        </Card>

        {/* Section 3: Planification */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('planning', 'Planification', Calendar)}
          {expanded.planning && (
            <div className="pt-4 space-y-4 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date début</label>
                  <input type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Deadline</label>
                  <input type="datetime-local" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Durée estimée (heures)</label>
                  <input type="number" value={form.estimatedHours} onChange={(e) => set('estimatedHours', e.target.value)} min="0" step="0.5" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Récurrence</label>
                  <select value={form.recurrence} onChange={(e) => set('recurrence', e.target.value)} className={inputClass}>
                    {recurrenceOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Section 4: Liaison système */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('liaison', 'Liaison système', Link2)}
          {expanded.liaison && (
            <div className="pt-4 space-y-4 p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Lie cette tâche à une commande, réservation ou livraison existante</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Commande ID" value={form.orderId} onChange={(e) => set('orderId', e.target.value)} placeholder="ID commande" />
                <Input label="Réservation ID" value={form.bookingId} onChange={(e) => set('bookingId', e.target.value)} placeholder="ID réservation" />
                <Input label="Livraison ID" value={form.deliveryId} onChange={(e) => set('deliveryId', e.target.value)} placeholder="ID livraison" />
                <Input label="Événement ID" value={form.eventId} onChange={(e) => set('eventId', e.target.value)} placeholder="ID événement" />
                <Input label="Location ID" value={form.rentalId} onChange={(e) => set('rentalId', e.target.value)} placeholder="ID location" />
              </div>
            </div>
          )}
        </Card>

        {/* Section 5: Ressources & Contrôle qualité */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('ressources', 'Ressources & Contrôle qualité', ClipboardList)}
          {expanded.ressources && (
            <div className="pt-4 space-y-4 p-5">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <input type="checkbox" checked={form.requiresValidation} onChange={(e) => set('requiresValidation', e.target.checked)} className="rounded" />
                  <span className="text-sm">Validation manager requise</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <input type="checkbox" checked={form.requiresPhoto} onChange={(e) => set('requiresPhoto', e.target.checked)} className="rounded" />
                  <span className="text-sm">Photo preuve requise</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <input type="checkbox" checked={form.requiresSignature} onChange={(e) => set('requiresSignature', e.target.checked)} className="rounded" />
                  <span className="text-sm">Signature requise</span>
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ajouter des ressources</h4>
                {form.resources.map((res, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-2">
                    <span className="text-sm font-medium min-w-[80px]">{res.label}</span>
                    <span className="text-xs text-gray-500 truncate flex-1">{res.url}</span>
                    <button type="button" onClick={() => set('resources', form.resources.filter((_, j) => j !== i))}
                      className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input value={newResourceLabel} onChange={(e) => setNewResourceLabel(e.target.value)}
                    placeholder="Libellé" className={inputClass} />
                  <input value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="URL" className={inputClass} />
                  <Button type="button" variant="outline" onClick={addResource}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Section 6: Checklist */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('checklist', 'Checklist', CheckSquare)}
          {expanded.checklist && (
            <div className="pt-4 space-y-4 p-5">
              {form.checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm flex-1">{item}</span>
                  <button type="button" onClick={() => set('checklistItems', form.checklistItems.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Ajouter une étape..." className={cn(inputClass, 'flex-1')}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())} />
                <Button type="button" variant="outline" onClick={addChecklistItem}>Ajouter</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Section 7: Notes */}
        <Card padding="none" className="overflow-hidden">
          {renderSectionHeader('notes', 'Notes', FileText)}
          {expanded.notes && (
            <div className="pt-4 space-y-4 p-5">
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Notes additionnelles..."
              />
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Link href="/dashboard/tasks">
            <Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Annuler</Button>
          </Link>
          <Button type="submit" isLoading={createTask.isPending}>
            {createTask.isPending ? null : <Save className="h-4 w-4 mr-1.5" />}
            {createTask.isPending ? 'Enregistrement...' : 'Créer la tâche'}
          </Button>
        </div>
      </form>
    </div>
  );
}
