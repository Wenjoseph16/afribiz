'use client';

import { useState, useEffect } from 'react';
import {
  Key, Webhook, Save, Copy, Check, Eye, EyeOff, Plus,
  Trash2, Clock, Power, PowerOff, ExternalLink, Code, Activity,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperProfile, useUpdateDeveloperProfile } from '@/features/developerHooks';
import {
  useApiKeys, useCreateApiKey, useRevokeApiKey,
  useWebhooks, useWebhookDeliveries,
  useCreateWebhook, useDeleteWebhook,
} from '@/features/developerModulesHooks';
import type { DeveloperApiKey, ModuleWebhook, WebhookDelivery } from '@/types/developer';

const WEBHOOK_EVENT_LABELS: Record<string, string> = {
  MODULE_INSTALLED: 'Installation',
  MODULE_UNINSTALLED: 'Désinstallation',
  MODULE_SOLD: 'Vente',
  MODULE_REVIEWED: 'Avis',
  MODULE_UPDATED: 'Mise à jour',
  MODULE_LICENSE_EXPIRING: 'Licence expirant',
  MODULE_LICENSE_EXPIRED: 'Licence expirée',
  MODULE_ERROR: 'Erreur',
  PAYOUT_REQUESTED: 'Paiement',
  TICKET_CREATED: 'Ticket créé',
  TICKET_RESOLVED: 'Ticket résolu',
};

const DELIVERY_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  DELIVERED: 'success',
  PENDING: 'warning',
  RETRYING: 'warning',
  FAILED: 'danger',
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  DELIVERED: 'Livré',
  PENDING: 'En attente',
  RETRYING: 'Nouvel essai',
  FAILED: 'Échec',
};

export default function ApiPage() {
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useDeveloperProfile();
  const updateProfile = useUpdateDeveloperProfile();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const { data: webhooks, isLoading: webhooksLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: deliveries } = useWebhookDeliveries(selectedWebhookId || '', 10);

  useEffect(() => {
    if (profile) {
      setWebhookUrl(profile.webhookUrl || '');
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWebhook = async () => {
    try {
      await updateProfile.mutateAsync({ webhookUrl: webhookUrl || null });
      showToast('Webhook URL enregistrée', 'success');
    } catch {
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      await createApiKey.mutateAsync({ name: newKeyName.trim() });
      setNewKeyName('');
      setShowCreateKey(false);
      showToast('Clé API créée', 'success');
    } catch {
      showToast('Erreur de création', 'error');
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir révoquer cette clé API ?');
    if (!confirmed) return;
    try {
      await revokeApiKey.mutateAsync(id);
      showToast('Clé API révoquée', 'success');
    } catch {
      showToast('Erreur lors de la révocation', 'error');
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) return;
    try {
      await createWebhook.mutateAsync({
        url: newWebhookUrl.trim(),
        events: newWebhookEvents,
      });
      setNewWebhookUrl('');
      setNewWebhookEvents([]);
      setShowCreateWebhook(false);
      showToast('Webhook créé', 'success');
    } catch {
      showToast('Erreur de création', 'error');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const confirmed = window.confirm('Supprimer ce webhook ?');
    if (!confirmed) return;
    try {
      await deleteWebhook.mutateAsync(id);
      if (selectedWebhookId === id) setSelectedWebhookId(null);
      showToast('Webhook supprimé', 'success');
    } catch {
      showToast('Erreur de suppression', 'error');
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (profileError) return <ErrorState message={profileError.message} onRetry={refetchProfile} />;
  if (profileLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={cn(
          'p-3 rounded-xl text-sm font-medium',
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <PageHeader
        title="API & Intégrations"
        description="Gérez vos clés API, webhooks et intégrations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'API' },
        ]}
      />

      {/* Main API Key */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Key className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clé API principale</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Utilisée pour l'authentification de base</p>
          </div>
        </div>

        {profile?.apiKey ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
              {showKey ? profile.apiKey : `${profile.apiKey.slice(0, 8)}...${profile.apiKey.slice(-4)}`}
            </code>
            <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => handleCopyKey(profile.apiKey!)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">Aucune clé API générée.</p>
        )}
      </Card>

      {/* API Keys Management */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600"><Key className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clés API</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clés supplémentaires pour vos applications</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowCreateKey(!showCreateKey)}>
            <Plus className="h-4 w-4" />
            Nouvelle clé
          </Button>
        </div>

        {showCreateKey && (
          <div className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-brand/20 space-y-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Nom de la clé (ex: Production, Staging...)"
              icon={<Key className="h-4 w-4" />}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowCreateKey(false); setNewKeyName(''); }}>
                Annuler
              </Button>
              <Button variant="gradient" size="sm" onClick={handleCreateApiKey} isLoading={createApiKey.isPending} disabled={!newKeyName.trim()}>
                <Plus className="h-4 w-4" /> Créer
              </Button>
            </div>
          </div>
        )}

        {keysLoading ? (
          <Loader className="py-8" />
        ) : !apiKeys || apiKeys.length === 0 ? (
          <EmptyState
            icon={<Key className="h-8 w-8" />}
            title="Aucune clé API"
            description="Créez des clés API pour vos applications."
          />
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key: DeveloperApiKey) => (
              <div key={key.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    key.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  )} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{key.name}</span>
                      <Badge variant={key.isActive ? 'success' : 'default'} size="xs">
                        {key.isActive ? 'Active' : 'Révoquée'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {key.key.substring(0, 12)}...{key.key.slice(-4)}
                      </code>
                      {key.lastUsedAt && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dernier usage : {new Date(key.lastUsedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleCopyKey(key.key)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {key.isActive && (
                    <button onClick={() => handleRevokeApiKey(key.id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Webhook URL (legacy) */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><Webhook className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Webhook URL par défaut</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">URL de callback pour les notifications globales</p>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://monapp.com/webhook"
              icon={<Webhook className="h-4 w-4" />}
            />
          </div>
          <Button size="sm" onClick={handleSaveWebhook} isLoading={updateProfile.isPending}>
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </Card>

      {/* Webhooks Management */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Webhook className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Webhooks</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recevez des notifications en temps réel</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowCreateWebhook(!showCreateWebhook)}>
            <Plus className="h-4 w-4" />
            Nouveau webhook
          </Button>
        </div>

        {showCreateWebhook && (
          <div className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-brand/20 space-y-3">
            <Input
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://monapp.com/webhook"
              icon={<Webhook className="h-4 w-4" />}
            />
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Événements</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(WEBHOOK_EVENT_LABELS).map(([event, label]) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                      newWebhookEvents.includes(event)
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowCreateWebhook(false); setNewWebhookUrl(''); setNewWebhookEvents([]); }}>
                Annuler
              </Button>
              <Button variant="gradient" size="sm" onClick={handleCreateWebhook} isLoading={createWebhook.isPending} disabled={!newWebhookUrl.trim() || newWebhookEvents.length === 0}>
                <Plus className="h-4 w-4" /> Créer
              </Button>
            </div>
          </div>
        )}

        {webhooksLoading ? (
          <Loader className="py-8" />
        ) : !webhooks || webhooks.length === 0 ? (
          <EmptyState
            icon={<Webhook className="h-8 w-8" />}
            title="Aucun webhook"
            description="Créez des webhooks pour recevoir des notifications."
          />
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh: ModuleWebhook) => (
              <div key={wh.id}>
                <div
                  className={cn(
                    'flex items-start justify-between p-4 rounded-xl border transition-colors cursor-pointer',
                    selectedWebhookId === wh.id
                      ? 'border-brand bg-brand-50/50 dark:bg-brand-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                  onClick={() => setSelectedWebhookId(selectedWebhookId === wh.id ? null : wh.id)}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      wh.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {wh.isActive
                        ? <Power className="h-4 w-4 text-emerald-600" />
                        : <PowerOff className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">{wh.url}</code>
                        <Badge variant={wh.isActive ? 'success' : 'default'} size="xs">
                          {wh.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex flex-wrap gap-1">
                          {wh.events.slice(0, 4).map((e) => (
                            <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              {WEBHOOK_EVENT_LABELS[e] || e}
                            </span>
                          ))}
                          {wh.events.length > 4 && (
                            <span className="text-[10px] text-gray-400">+{wh.events.length - 4}</span>
                          )}
                        </div>
                        {wh.module?.name && (
                          <span className="text-[10px] text-gray-400">· {wh.module.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteWebhook(wh.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Deliveries */}
                {selectedWebhookId === wh.id && (
                  <div className="mt-2 ml-12 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Livraisons récentes</span>
                      <span className="text-[10px] text-gray-400">({wh._count?.deliveries || 0} total)</span>
                    </div>
                    {!deliveries || deliveries.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">Aucune livraison pour le moment</p>
                    ) : (
                      <div className="space-y-1.5">
                        {deliveries.map((d: WebhookDelivery) => (
                          <div key={d.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-white dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-2">
                              <Badge variant={DELIVERY_STATUS_VARIANT[d.status] || 'default'} size="xs">
                                {DELIVERY_STATUS_LABELS[d.status] || d.status}
                              </Badge>
                              <span className="text-gray-600 dark:text-gray-400">{d.event}</span>
                              <span className="text-gray-400">({d.attempts} tentatives)</span>
                            </div>
                            <span className="text-gray-400">
                              {new Date(d.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Documentation */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Documentation API</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Modules', desc: 'CRUD, versions, publication' },
            { title: 'Paiements', desc: 'Transactions, abonnements' },
            { title: 'Clients', desc: 'Installations, métriques' },
            { title: 'Marketplace', desc: 'Recherche, catégories' },
            { title: 'Webhooks', desc: 'Événements, notifications' },
            { title: 'Authentification', desc: 'OAuth 2.0, tokens' },
          ].map((d) => (
            <a key={d.title} href="#" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <Code className="h-5 w-5 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{d.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
