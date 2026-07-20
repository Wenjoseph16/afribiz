'use client';

import { useState, useEffect } from 'react';
import {
  Mic,
  Plus,
  Search,
  Globe,
  BarChart3,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  Headphones,
  MessageSquare,
  Languages,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

export default function VoicePage() {
  const [activeTab, setActiveTab] = useState<'commands' | 'queries' | 'stats'>('commands');
  const [commands, setCommands] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newCmd, setNewCmd] = useState({
    command: '',
    action: 'SEARCH',
    language: 'fr',
    params: '{}',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, qRes, sRes] = await Promise.all([
        apiClient.getVoiceCommands().catch(() => ({ data: { data: [] } })),
        apiClient.getVoiceQueries().catch(() => ({ data: { data: [] } })),
        apiClient
          .getVoiceStats()
          .catch(() => ({ data: { data: { totalQueries: 0, byAction: [] } } })),
      ]);
      setCommands(cRes.data?.data || []);
      setQueries(qRes.data?.data || []);
      setStats(sRes.data?.data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      await apiClient.createVoiceCommand({ ...newCmd, params: JSON.parse(newCmd.params || '{}') });
      setShowNew(false);
      setNewCmd({ command: '', action: 'SEARCH', language: 'fr', params: '{}' });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteVoiceCommand(deleteTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setDeleteTarget(null);
  };

  const actionLabels: Record<string, string> = {
    SEARCH: 'Recherche',
    ORDER: 'Commande',
    BOOK: 'Réservation',
    CALL: 'Appel',
    INFO: 'Info',
  };
  const actionColors: Record<string, string> = {
    SEARCH: 'text-blue-500',
    ORDER: 'text-green-500',
    BOOK: 'text-purple-500',
    CALL: 'text-amber-500',
    INFO: 'text-gray-500',
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  const tabs = [
    { key: 'commands' as const, label: 'Commandes', icon: Headphones },
    { key: 'queries' as const, label: 'Requêtes', icon: MessageSquare },
    { key: 'stats' as const, label: 'Stats', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Catalogue Vocal"
        description="Commandes vocales, transcription et recherche multilingue"
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Catalogue Vocal' }]}
        actions={
          activeTab === 'commands' && (
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Ajouter une commande
            </button>
          )
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'commands' && (
        <div className="space-y-3">
          {commands.map((c: any) => (
            <Card key={c.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-brand-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-brand-600">
                      {c.command}
                    </code>
                    <Badge>{actionLabels[c.action] || c.action}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.language || 'fr'} · {c.isActive ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
          {commands.length === 0 && (
            <Card className="p-8 text-center">
              <Headphones className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucune commande
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajoutez des commandes vocales pour permettre à vos clients de naviguer par la voix.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="space-y-3">
          {queries.map((q: any) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      "{q.query}"
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className={`font-medium ${actionColors[q.action] || ''}`}>
                        {actionLabels[q.action] || q.action}
                      </span>
                      <span>{q.language || 'fr'}</span>
                      <span>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
                {q.response && <Badge variant="success">Répondu</Badge>}
              </div>
            </Card>
          ))}
          {queries.length === 0 && (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucune requête
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Les requêtes vocales de vos clients apparaîtront ici.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <Mic className="w-8 h-8 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {commands.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Commandes vocales</p>
              <p className="text-xs text-gray-400 mt-1">Mots-clés actifs</p>
            </Card>
            <Card className="p-5">
              <Search className="w-8 h-8 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {stats.totalQueries || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Requêtes traitées</p>
              <p className="text-xs text-gray-400 mt-1">Total</p>
            </Card>
            <Card className="p-5">
              <Languages className="w-8 h-8 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">3</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Langues supportées</p>
              <p className="text-xs text-gray-400 mt-1">FR, EN, plus</p>
            </Card>
          </div>

          {stats.byAction?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Requêtes par action
              </h3>
              <div className="space-y-3">
                {stats.byAction.map((a: any) => (
                  <div key={a.action} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {actionLabels[a.action] || a.action}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (a.count / Math.max(...stats.byAction.map((x: any) => x.count))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">
                        {a.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal: Nouvelle commande */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvelle commande vocale">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commande
            </label>
            <input
              value={newCmd.command}
              onChange={(e) => setNewCmd({ ...newCmd, command: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
              placeholder="commander [produit]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <Select
                value={newCmd.action}
                onChange={(e) => setNewCmd({ ...newCmd, action: e.target.value })}
                options={[
                  { value: 'SEARCH', label: 'Recherche' },
                  { value: 'ORDER', label: 'Commande' },
                  { value: 'BOOK', label: 'Réservation' },
                  { value: 'CALL', label: 'Appel' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Langue
              </label>
              <Select
                value={newCmd.language}
                onChange={(e) => setNewCmd({ ...newCmd, language: e.target.value })}
                options={[
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'Anglais' },
                  { value: 'wo', label: 'Wolof' },
                  { value: 'bm', label: 'Bambara' },
                ]}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newCmd.command}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer la commande"
        description="Êtes-vous sûr de vouloir supprimer cette commande vocale ?"
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
