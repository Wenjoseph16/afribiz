'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Loader, AlertTriangle, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Modal } from '@/components/ui/Modal';
import {
  useAutomationRules,
  useCreateAutomationRule,
  useUpdateAutomationRule,
  useToggleAutomationRule,
  useDeleteAutomationRule,
} from '@/features/automationHooks';

const TRIGGER_OPTIONS = [
  { value: 'DEAL_CREATED', label: 'Deal créé' },
  { value: 'DEAL_WON', label: 'Deal gagné' },
  { value: 'DEAL_LOST', label: 'Deal perdu' },
  { value: 'DEAL_STAGE_CHANGED', label: 'Étape de deal changée' },
  { value: 'CLIENT_CREATED', label: 'Client créé' },
  { value: 'CLIENT_INACTIVE', label: 'Client inactif' },
];

const ACTION_OPTIONS = [
  { value: 'SEND_NOTIFICATION', label: 'Envoyer une notification' },
  { value: 'MOVE_DEAL', label: 'Déplacer un deal' },
  { value: 'CHANGE_PROBABILITY', label: 'Changer la probabilité' },
  { value: 'ASSIGN_TAG', label: 'Assigner un tag' },
];

const TRIGGER_LABELS: Record<string, string> = {
  DEAL_CREATED: 'Deal créé',
  DEAL_WON: 'Deal gagné',
  DEAL_LOST: 'Deal perdu',
  DEAL_STAGE_CHANGED: 'Étape changée',
  CLIENT_CREATED: 'Client créé',
  CLIENT_INACTIVE: 'Client inactif',
};

const ACTION_LABELS: Record<string, string> = {
  SEND_NOTIFICATION: 'Notification',
  MOVE_DEAL: 'Déplacer deal',
  CHANGE_PROBABILITY: 'Changer probabilité',
  ASSIGN_TAG: 'Assigner tag',
};

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AutomationPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: rules, isLoading, error, refetch } = useAutomationRules();
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();
  const toggleRule = useToggleAutomationRule();
  const deleteRule = useDeleteAutomationRule();

  const rulesList = Array.isArray(rules) ? rules : [];

  const handleOpenCreate = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleToggle = async (ruleId: string) => {
    await toggleRule.mutateAsync(ruleId);
  };

  const handleDelete = async (ruleId: string) => {
    await deleteRule.mutateAsync(ruleId);
    setDeleteConfirm(null);
  };

  useEffect(() => {
    const actionSelect = document.querySelector('select[name="action"]');
    const toggleConfig = () => {
      document.querySelectorAll('[id^="config-"]').forEach((el) => {
        el.classList.add('hidden');
      });
      const val = (actionSelect as HTMLSelectElement)?.value;
      if (val) {
        const target = document.getElementById(`config-${val.toLowerCase()}`);
        if (target) target.classList.remove('hidden');
      }
    };
    toggleConfig();
    actionSelect?.addEventListener('change', toggleConfig);
    return () => actionSelect?.removeEventListener('change', toggleConfig);
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const action = formData.get('action') as string;
    const actionConfig: any = {};

    if (action === 'SEND_NOTIFICATION') {
      actionConfig.notificationTitle = formData.get('notificationTitle') as string;
      actionConfig.notificationBody = formData.get('notificationBody') as string;
    } else if (action === 'MOVE_DEAL') {
      actionConfig.stageId = formData.get('stageId') as string;
    } else if (action === 'CHANGE_PROBABILITY') {
      actionConfig.probability = parseInt(formData.get('probability') as string, 10) || 0;
    } else if (action === 'ASSIGN_TAG') {
      actionConfig.tagId = formData.get('tagId') as string;
    }

    const payload = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      trigger: formData.get('trigger') as string,
      action,
      actionConfig,
    };

    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, data: payload });
    } else {
      await createRule.mutateAsync(payload);
    }
    handleCloseModal();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Automatisation CRM"
          description="Règles d'automatisation du pipeline et des clients"
          gradient
        />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Automatisation CRM"
          description="Règles d'automatisation du pipeline et des clients"
          gradient
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Automatisation CRM"
        description="Règles d'automatisation du pipeline et des clients"
        gradient
        actions={
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </Button>
        }
      />

      {rulesList.length === 0 ? (
        <Card className="py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/20 border border-brand-100/50 dark:border-brand-800/30 flex items-center justify-center mb-5 text-brand/40 dark:text-brand-400/40">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
              Aucune règle d&apos;automatisation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">
              Créez votre première règle pour automatiser les actions CRM comme les notifications,
              les déplacements de deal, ou les changements de probabilité.
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Nouvelle règle
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rulesList.map((rule: any) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {rule.name}
                    </h3>
                    <Badge size="xs" variant={rule.isActive ? 'success' : 'default'}>
                      {rule.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  {rule.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                      {rule.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Déclencheur :{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {TRIGGER_LABELS[rule.trigger] || rule.trigger}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Action :{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {ACTION_LABELS[rule.action] || rule.action}
                      </span>
                    </span>
                    <span>
                      Exécutions :{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {rule.runCount ?? 0}
                      </span>
                    </span>
                    {rule.lastRunAt && (
                      <span>
                        Dernière exécution :{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(rule.lastRunAt)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    disabled={toggleRule.isPending}
                    className={`p-2 rounded-xl border transition-all ${
                      rule.isActive
                        ? 'border-green-200 dark:border-green-800/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={rule.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title="Modifier"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(rule.id)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingRule ? 'Modifier la règle' : "Nouvelle règle d'automatisation"}
        description={
          editingRule
            ? `Modifier "${editingRule.name}"`
            : 'Créez une règle pour automatiser vos actions CRM'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom *
              </label>
              <input
                name="name"
                defaultValue={editingRule?.name || ''}
                required
                placeholder="Ex: Notification nouveau deal"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <input
                name="description"
                defaultValue={editingRule?.description || ''}
                placeholder="Description de la règle..."
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Déclencheur *
              </label>
              <select
                name="trigger"
                defaultValue={editingRule?.trigger || ''}
                required
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              >
                <option value="">Sélectionner un déclencheur</option>
                {TRIGGER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Action *
              </label>
              <select
                name="action"
                defaultValue={editingRule?.action || ''}
                required
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              >
                <option value="">Sélectionner une action</option>
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4 border border-gray-100 dark:border-gray-700/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Configuration de l&apos;action
            </p>

            <div id="config-send_notification" className="space-y-3 hidden">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Titre de la notification
                </label>
                <input
                  name="notificationTitle"
                  defaultValue={editingRule?.actionConfig?.notificationTitle || ''}
                  placeholder="Ex: Nouveau deal créé"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Corps de la notification
                </label>
                <textarea
                  name="notificationBody"
                  defaultValue={editingRule?.actionConfig?.notificationBody || ''}
                  rows={2}
                  placeholder="Contenu de la notification..."
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                />
              </div>
            </div>

            <div id="config-move_deal" className="space-y-3 hidden">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ID de l&apos;étape de destination
                </label>
                <input
                  name="stageId"
                  defaultValue={editingRule?.actionConfig?.stageId || ''}
                  placeholder="stageId..."
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div id="config-change_probability" className="space-y-3 hidden">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Probabilité (0-100)
                </label>
                <input
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editingRule?.actionConfig?.probability ?? ''}
                  placeholder="50"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>

            <div id="config-assign_tag" className="space-y-3 hidden">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  ID du tag
                </label>
                <input
                  name="tagId"
                  defaultValue={editingRule?.actionConfig?.tagId || ''}
                  placeholder="tagId..."
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createRule.isPending || updateRule.isPending}>
              {editingRule ? 'Enregistrer' : 'Créer la règle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette règle d'automatisation ? Cette action est irréversible."
        size="sm"
      >
        <div className="flex items-center gap-3 justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteRule.isPending}
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
