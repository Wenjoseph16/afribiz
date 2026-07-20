'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Hammer,
  UserPlus,
  Tag,
  ShoppingBag,
  Calendar,
  CreditCard,
  Star,
  MessageCircle,
  Package,
  X,
  Loader2,
  Filter,
  Search,
  Bell,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';

// ── Types ──

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions?: any;
  actionType: string;
  actionConfig: any;
  triggerConfig?: any;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

type WorkflowStep = 'trigger' | 'condition' | 'action';

const TRIGGER_OPTIONS = [
  {
    value: 'ORDER_PLACED',
    label: 'Commande passée',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    value: 'ORDER_CONFIRMED',
    label: 'Commande confirmée',
    icon: Package,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'ORDER_DELIVERED',
    label: 'Commande livrée',
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'ORDER_CANCELLED',
    label: 'Commande annulée',
    icon: X,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    value: 'BOOKING_CREATED',
    label: 'Réservation créée',
    icon: Calendar,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    value: 'BOOKING_CONFIRMED',
    label: 'Réservation confirmée',
    icon: Calendar,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'BOOKING_REMINDER',
    label: 'Rappel réservation',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    value: 'PAYMENT_RECEIVED',
    label: 'Paiement reçu',
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'PAYMENT_FAILED',
    label: 'Paiement échoué',
    icon: CreditCard,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    value: 'REVIEW_PUBLISHED',
    label: 'Avis publié',
    icon: Star,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    value: 'NEW_MESSAGE',
    label: 'Nouveau message',
    icon: MessageCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    value: 'CART_ABANDONED',
    label: 'Panier abandonné',
    icon: ShoppingBag,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    value: 'LOW_STOCK',
    label: 'Stock faible',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    value: 'CLIENT_BIRTHDAY',
    label: 'Anniversaire client',
    icon: Star,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    value: 'SCHEDULED',
    label: 'Planifié (cron)',
    icon: Clock,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

const ACTION_OPTIONS = [
  {
    value: 'SEND_NOTIFICATION',
    label: 'Notification in-app',
    icon: Bell,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'SEND_EMAIL',
    label: 'Envoyer un email',
    icon: Mail,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'SEND_SMS',
    label: 'Envoyer un SMS',
    icon: Smartphone,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    value: 'SEND_WHATSAPP',
    label: 'Envoyer WhatsApp',
    icon: MessageSquare,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'ASSIGN_TAG',
    label: 'Assigner un tag client',
    icon: Tag,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    value: 'APPLY_DISCOUNT',
    label: 'Appliquer une réduction',
    icon: ShoppingBag,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    value: 'MOVE_DEAL',
    label: 'Déplacer dans pipeline',
    icon: RefreshCw,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    value: 'CREATE_TASK',
    label: 'Créer une tâche',
    icon: Hammer,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    value: 'ADD_SEGMENT',
    label: 'Ajouter à un segment',
    icon: UserPlus,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

// ── Templates prêts ──

const TEMPLATES = [
  {
    id: 'order-delivered',
    name: 'Commande livrée',
    description: 'Notifier le client et ajouter au segment "fidèle"',
    trigger: 'ORDER_DELIVERED',
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      notificationTitle: 'Merci pour votre commande !',
      notificationBody: "Votre commande a été livrée. N'hésitez pas à laisser un avis.",
    },
    conditions: [],
    category: 'commandes',
  },
  {
    id: 'cart-abandoned',
    name: 'Panier abandonné',
    description: "Relancer le client après 1h d'inactivité",
    trigger: 'CART_ABANDONED',
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      notificationTitle: 'Votre panier vous attend',
      notificationBody: 'Vous avez des articles dans votre panier. Finalisez votre commande !',
    },
    conditions: [],
    category: 'ventes',
  },
  {
    id: 'client-birthday',
    name: 'Anniversaire client',
    description: "Souhaiter l'anniversaire avec un coupon de réduction",
    trigger: 'CLIENT_BIRTHDAY',
    actionType: 'APPLY_DISCOUNT',
    actionConfig: { discountPercent: 10, discountLabel: 'Joyeux anniversaire !' },
    conditions: [],
    category: 'fidélisation',
  },
  {
    id: 'low-stock',
    name: 'Stock critique',
    description: 'Alerter quand un produit est en stock faible',
    trigger: 'LOW_STOCK',
    actionType: 'CREATE_TASK',
    actionConfig: { taskTitle: 'Réapprovisionner le stock', taskPriority: 'high' },
    conditions: [],
    category: 'inventaire',
  },
  {
    id: 'new-review',
    name: 'Nouvel avis client',
    description: 'Notifier le business pour répondre rapidement',
    trigger: 'REVIEW_PUBLISHED',
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      notificationTitle: 'Nouvel avis reçu',
      notificationBody: 'Un client a laissé un avis. Répondez-y rapidement.',
    },
    conditions: [],
    category: 'service',
  },
  {
    id: 'welcome-message',
    name: 'Bienvenue nouveau client',
    description: 'Tagguer le client et envoyer un coupon de bienvenue',
    trigger: 'ORDER_PLACED',
    actionType: 'APPLY_DISCOUNT',
    actionConfig: {
      discountPercent: 5,
      discountLabel: 'Bienvenue - 5% sur votre prochaine commande',
    },
    conditions: [],
    category: 'accueil',
  },
];

// ── Main Component ──

export function AutomationWorkflowBuilder() {
  const queryClient = useQueryClient();
  const [showCreator, setShowCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── New rule form state ──
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    trigger: 'ORDER_PLACED',
    conditions: [] as any[],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: { notificationTitle: '', notificationBody: '' } as any,
  });

  // Fetch rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const res = await apiClient.get('/business/crm/automation');
      return res.data.data as AutomationRule[];
    },
    refetchInterval: 30000,
  });

  // Fetch execution logs
  const { data: logsData } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/business/crm/automation/logs');
        return res.data.data as any[];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const rules = Array.isArray(rulesData) ? rulesData : [];
  const logs = Array.isArray(logsData) ? logsData : [];

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.patch(`/business/crm/automation/${ruleId}/toggle`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(`/business/crm/automation/${ruleId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post('/business/crm/automation', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowCreator(false);
      setNewRule({
        name: '',
        description: '',
        trigger: 'ORDER_PLACED',
        conditions: [],
        actionType: 'SEND_NOTIFICATION',
        actionConfig: { notificationTitle: '', notificationBody: '' },
      });
      setSelectedTemplate(null);
    },
  });

  // Filtered rules
  const filteredRules = useMemo(() => {
    let items = [...rules];
    if (filterStatus) items = items.filter((r) => r.status === filterStatus);
    if (filterTrigger) items = items.filter((r) => r.trigger === filterTrigger);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rules, filterStatus, filterTrigger, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const active = rules.filter((r) => r.status === 'ACTIVE').length;
    const totalExecutions = rules.reduce((s, r) => s + r.executionCount, 0);
    return {
      total: rules.length,
      active,
      paused: rules.length - active,
      executions: totalExecutions,
    };
  }, [rules]);

  const handleApplyTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setNewRule({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: template.conditions || [],
      actionType: template.actionType,
      actionConfig: template.actionConfig,
    });
    setShowCreator(true);
  };

  const handleCreateRule = () => {
    if (!newRule.name.trim()) return;
    createMutation.mutate({
      name: newRule.name,
      description: newRule.description,
      trigger: newRule.trigger,
      conditions: newRule.conditions,
      actionType: newRule.actionType,
      actionConfig: newRule.actionConfig,
    });
  };

  const getTriggerInfo = (trigger: string) => {
    return (
      TRIGGER_OPTIONS.find((t) => t.value === trigger) || {
        label: trigger,
        icon: Zap,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
      }
    );
  };

  const getActionInfo = (actionType: string) => {
    return (
      ACTION_OPTIONS.find((a) => a.value === actionType) || {
        label: actionType,
        icon: Zap,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Automatisations</h2>
          <p className="text-sm text-gray-500">
            Créez des règles qui déclenchent des actions automatiquement
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nouvelle règle
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="Règles actives"
          value={stats.active.toString()}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          icon={Clock}
          label="Règles en pause"
          value={stats.paused.toString()}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard
          icon={Play}
          label="Exécutions"
          value={stats.executions.toLocaleString()}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={FileText}
          label="Total règles"
          value={stats.total.toString()}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Templates section */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Templates prêts à l'emploi
          </h3>
          <span className="text-xs text-gray-400">{TEMPLATES.length} templates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((template) => {
            const trigInfo = getTriggerInfo(template.trigger);
            const TrigIcon = trigInfo.icon;
            const actInfo = getActionInfo(template.actionType);
            const ActIcon = actInfo.icon;
            return (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template.id)}
                className={cn(
                  'text-left p-4 rounded-xl border transition-all group hover:shadow-sm',
                  selectedTemplate === template.id
                    ? 'border-brand bg-brand/5 dark:bg-brand/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium uppercase text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {template.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">{template.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded', trigInfo.bg)}>
                    <TrigIcon className={cn('h-3 w-3', trigInfo.color)} />
                    <span>{trigInfo.label}</span>
                  </div>
                  <ChevronRight className="h-3 w-3" />
                  <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded', actInfo.bg)}>
                    <ActIcon className={cn('h-3 w-3', actInfo.color)} />
                    <span>{actInfo.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Rules List */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Règles ({filteredRules.length})
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="PAUSED">En pause</option>
              <option value="DRAFT">Brouillon</option>
            </select>
          </div>
        </div>

        {filteredRules.length === 0 ? (
          <EmptyState
            icon={<Zap className="h-10 w-10" />}
            title="Aucune règle d'automatisation"
            description="Créez votre première règle pour automatiser vos actions."
            action={
              <Button size="sm" onClick={() => setShowCreator(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Créer une règle
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredRules.map((rule) => {
              const trigInfo = getTriggerInfo(rule.trigger);
              const TrigIcon = trigInfo.icon;
              const actInfo = getActionInfo(rule.actionType);
              const ActIcon = actInfo.icon;
              const isActive = rule.status === 'ACTIVE';

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                    isActive
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-75'
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Status indicator */}
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        isActive
                          ? 'bg-emerald-500'
                          : rule.status === 'PAUSED'
                            ? 'bg-amber-400'
                            : 'bg-gray-300'
                      )}
                    />

                    {/* Rule info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {rule.name}
                        </p>
                        <Badge
                          variant={
                            isActive ? 'success' : rule.status === 'PAUSED' ? 'warning' : 'default'
                          }
                          size="xs"
                        >
                          {isActive ? 'Actif' : rule.status === 'PAUSED' ? 'En pause' : 'Brouillon'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
                            trigInfo.bg
                          )}
                        >
                          <TrigIcon className={cn('h-3 w-3', trigInfo.color)} />
                          <span className={trigInfo.color}>{trigInfo.label}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-gray-300" />
                        <div
                          className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
                            actInfo.bg
                          )}
                        >
                          <ActIcon className={cn('h-3 w-3', actInfo.color)} />
                          <span className={actInfo.color}>{actInfo.label}</span>
                        </div>
                        {rule.executionCount > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {rule.executionCount}x exécuté{rule.executionCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button
                      onClick={() => toggleMutation.mutate(rule.id)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      )}
                      title={isActive ? 'Mettre en pause' : 'Activer'}
                    >
                      {isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(rule.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Execution Logs */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Dernières exécutions
          </h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucune exécution récente. Les actions automatisées apparaîtront ici.
          </p>
        ) : (
          <div className="space-y-1">
            {logs.slice(0, 10).map((log: any, i: number) => (
              <div
                key={log.id || i}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {log.ruleName || 'Règle exécutée'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {selectedTemplate ? 'Appliquer le template' : 'Nouvelle règle'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Définissez le déclencheur et l'action
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreator(false);
                  setSelectedTemplate(null);
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de la règle *
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="Ex: Relancer les paniers abandonnés"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                  rows={2}
                  placeholder="Description optionnelle"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Déclencheur
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {TRIGGER_OPTIONS.map((trigger) => {
                    const Icon = trigger.icon;
                    const isSelected = newRule.trigger === trigger.value;
                    return (
                      <button
                        key={trigger.value}
                        onClick={() => setNewRule({ ...newRule, trigger: trigger.value })}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all',
                          isSelected
                            ? 'border-brand bg-brand/5 dark:bg-brand/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <div className={cn('p-1.5 rounded-lg', trigger.bg)}>
                          <Icon className={cn('h-3.5 w-3.5', trigger.color)} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {trigger.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {ACTION_OPTIONS.map((action) => {
                    const Icon = action.icon;
                    const isSelected = newRule.actionType === action.value;
                    return (
                      <button
                        key={action.value}
                        onClick={() =>
                          setNewRule({
                            ...newRule,
                            actionType: action.value,
                            actionConfig:
                              action.value === 'SEND_NOTIFICATION'
                                ? { notificationTitle: '', notificationBody: '' }
                                : action.value === 'APPLY_DISCOUNT'
                                  ? { discountPercent: 10, discountLabel: '' }
                                  : action.value === 'CREATE_TASK'
                                    ? { taskTitle: '', taskPriority: 'medium' }
                                    : {},
                          })
                        }
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all',
                          isSelected
                            ? 'border-brand bg-brand/5 dark:bg-brand/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        )}
                      >
                        <div className={cn('p-1.5 rounded-lg', action.bg)}>
                          <Icon className={cn('h-3.5 w-3.5', action.color)} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Config */}
              {newRule.actionType === 'SEND_NOTIFICATION' && (
                <div className="space-y-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Configurer la notification
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
                    <input
                      type="text"
                      value={newRule.actionConfig.notificationTitle || ''}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          actionConfig: {
                            ...newRule.actionConfig,
                            notificationTitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
                      placeholder="Titre de la notification"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                    <textarea
                      value={newRule.actionConfig.notificationBody || ''}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          actionConfig: {
                            ...newRule.actionConfig,
                            notificationBody: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                      rows={2}
                      placeholder="Message de la notification"
                    />
                  </div>
                </div>
              )}

              {newRule.actionType === 'APPLY_DISCOUNT' && (
                <div className="space-y-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Configurer la réduction
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Réduction (%)
                      </label>
                      <input
                        type="number"
                        value={newRule.actionConfig.discountPercent || 10}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            actionConfig: {
                              ...newRule.actionConfig,
                              discountPercent: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Libellé
                      </label>
                      <input
                        type="text"
                        value={newRule.actionConfig.discountLabel || ''}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            actionConfig: {
                              ...newRule.actionConfig,
                              discountLabel: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
                        placeholder="Joyeux anniversaire !"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCreator(false);
                  setSelectedTemplate(null);
                }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleCreateRule}
                disabled={!newRule.name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1.5" />
                    Créer la règle
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800',
        bg
      )}
    >
      <div className={cn('p-2.5 rounded-lg', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className={cn('text-xl font-bold', color)}>{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
