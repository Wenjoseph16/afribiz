'use client';

import { useState } from 'react';
import {
  Bot, Plus, Search, X, Pencil, Trash2, Play, Pause, FileText, Eye,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const TRIGGERS = [
  'user_registered', 'user_logged_in', 'business_created',
  'transaction_completed', 'review_submitted', 'subscription_updated',
  'scheduled_daily', 'scheduled_weekly', 'scheduled_monthly',
];

const ACTIONS = ['send_email', 'send_sms', 'send_whatsapp', 'webhook', 'update_status', 'assign_role'];

const STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'];

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Actif', PAUSED: 'Suspendu', ARCHIVED: 'Archivé' };

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = { ACTIVE: 'success', PAUSED: 'warning', ARCHIVED: 'default' };

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  actionType: string;
  config: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  trigger: string;
  status: string;
  result: any;
  executedAt: string;
}

interface RuleForm {
  name: string;
  trigger: string;
  actionType: string;
  config: string;
}

const defaultForm: RuleForm = { name: '', trigger: '', actionType: '', config: '{}' };

function useRules(filters?: any) {
  return useQuery({
    queryKey: ['admin', 'automation', 'rules', filters],
    queryFn: async () => {
      const res = await apiClient.get('/admin/automation/rules', { params: filters });
      return res.data.data as AutomationRule[];
    },
  });
}

function useLogs(ruleId: string | null) {
  return useQuery({
    queryKey: ['admin', 'automation', 'logs', ruleId],
    queryFn: async () => {
      if (!ruleId) return [];
      const res = await apiClient.get(`/admin/automation/rules/${ruleId}/logs`);
      return res.data.data as ExecutionLog[];
    },
    enabled: !!ruleId,
  });
}

export default function AdminAutomationPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState<RuleForm>(defaultForm);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedRuleForLogs, setSelectedRuleForLogs] = useState<AutomationRule | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const filters: any = {};
  if (search) filters.search = search;
  if (triggerFilter) filters.trigger = triggerFilter;
  if (statusFilter) filters.status = statusFilter;

  const { data: rules, isLoading, error, refetch } = useRules(filters);
  const { data: logs, isLoading: logsLoading } = useLogs(selectedRuleForLogs?.id ?? null);

  const createMutation = useMutation({
    mutationFn: (data: RuleForm) => apiClient.post('/admin/automation/rules', { ...data, config: JSON.parse(data.config || '{}') }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'automation', 'rules'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RuleForm> }) => apiClient.put(`/admin/automation/rules/${id}`, { ...data, config: data.config ? JSON.parse(data.config) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'automation', 'rules'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/automation/rules/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'automation', 'rules'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/automation/rules/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'automation', 'rules'] }); },
  });

  const openCreate = () => {
    setEditingRule(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      trigger: rule.trigger,
      actionType: rule.actionType,
      config: JSON.stringify(rule.config, null, 2),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule.id, data: form });
        setToast({ message: 'Règle mise à jour avec succès', type: 'success' });
      } else {
        await createMutation.mutateAsync(form);
        setToast({ message: 'Règle créée avec succès', type: 'success' });
      }
      setModalOpen(false);
    } catch {
      setToast({ message: 'Erreur lors de l\'enregistrement de la règle', type: 'error' });
    }
  };

  const handleDelete = async (rule: AutomationRule) => {
    if (!window.confirm(`Supprimer la règle « ${rule.name} » ?`)) return;
    try {
      await deleteMutation.mutateAsync(rule.id);
      setToast({ message: 'Règle supprimée avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await toggleMutation.mutateAsync(rule.id);
      setToast({
        message: `Règle ${rule.status === 'ACTIVE' ? 'suspendue' : 'activée'} avec succès`,
        type: 'success',
      });
    } catch {
      setToast({ message: 'Erreur lors du basculement', type: 'error' });
    }
  };

  const openLogs = (rule: AutomationRule) => {
    setSelectedRuleForLogs(rule);
    setLogError(null);
    setLogsModalOpen(true);
  };

  const hasActiveFilters = search || triggerFilter || statusFilter;

  const clearFilters = () => {
    setSearch('');
    setTriggerFilter('');
    setStatusFilter('');
  };

  const ruleList = Array.isArray(rules) ? (rules as AutomationRule[]) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <PageHeader
        title="Règles d'automatisation"
        description="Gérez les règles automatisées de la plateforme"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Automatisation' },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </Button>
        }
      />

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les déclencheurs</option>
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : ruleList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Déclencheur</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Créé le</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ruleList.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{rule.name}</td>
                    <td className="p-4">
                      <Badge variant="info" size="xs">{rule.trigger.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="p-4 text-gray-500">{rule.actionType.replace(/_/g, ' ')}</td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANTS[rule.status]} size="xs">
                        {STATUS_LABELS[rule.status]}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(rule.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {(rule.status === 'ACTIVE' || rule.status === 'PAUSED') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggle(rule)}
                            isLoading={toggleMutation.isPending}
                            title={rule.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                          >
                            {rule.status === 'ACTIVE' ? (
                              <Pause className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => openEdit(rule)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => handleDelete(rule)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => openLogs(rule)}>
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs">Logs</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Bot className="h-8 w-8" />}
            title="Aucune règle d'automatisation"
            description={hasActiveFilters ? 'Aucune règle ne correspond aux filtres.' : 'Créez votre première règle d\'automatisation.'}
            action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Créer une règle</Button>}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'automatisation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            placeholder="ex: Envoyer email de bienvenue"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Déclencheur
            </label>
            <select
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              <option value="">Sélectionner un déclencheur</option>
              {TRIGGERS.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type d'action
            </label>
            <select
              value={form.actionType}
              onChange={(e) => setForm({ ...form, actionType: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              <option value="">Sélectionner une action</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Configuration (JSON)
            </label>
            <textarea
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
              placeholder='{ "key": "value" }'
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 font-mono text-xs resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingRule ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={logsModalOpen}
        onClose={() => { setLogsModalOpen(false); setSelectedRuleForLogs(null); }}
        title={`Logs d'exécution - ${selectedRuleForLogs?.name || ''}`}
        size="xl"
      >
        {logsLoading ? (
          <Loader className="py-10" />
        ) : logError ? (
          <p className="text-red-500 text-sm">{logError}</p>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {(logs as ExecutionLog[]).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={log.status === 'SUCCESS' ? 'success' : log.status === 'FAILED' ? 'danger' : 'warning'} size="xs">
                    {log.status}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(log.executedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                  {JSON.stringify(log.result, null, 2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="Aucun log"
            description="Cette règle n'a pas encore été exécutée."
          />
        )}
      </Modal>
    </div>
  );
}
