'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  Globe,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { apiClient } from '@/services/apiClient';

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'sessions' | 'stats'>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'MARKETING',
    language: 'fr',
    body: '',
    header: '',
    footer: '',
  });
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tRes, sRes, stRes] = await Promise.all([
        apiClient.getWhatsAppTemplates().catch(() => ({ data: { data: [] } })),
        apiClient.getWhatsAppSessions().catch(() => ({ data: { data: [] } })),
        apiClient.getWhatsAppStats().catch(() => ({
          data: { data: { totalSessions: 0, totalMessages: 0, templatesCount: 0 } },
        })),
      ]);
      setTemplates(tRes.data?.data || []);
      setSessions(sRes.data?.data || []);
      setStats(stRes.data?.data || { totalSessions: 0, totalMessages: 0, templatesCount: 0 });
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = async () => {
    try {
      await apiClient.createWhatsAppTemplate(newTemplate);
      setShowNewTemplate(false);
      setNewTemplate({
        name: '',
        category: 'MARKETING',
        language: 'fr',
        body: '',
        header: '',
        footer: '',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteWhatsAppTemplate(deleteTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setDeleteTarget(null);
  };

  const handleSendMessage = async (sessionId: string) => {
    if (!messageContent.trim()) return;
    setSendingMsg(true);
    try {
      await apiClient.sendWhatsAppMessage({ sessionId, content: messageContent });
      setMessageContent('');
      setShowSendMessage(null);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    } finally {
      setSendingMsg(false);
    }
  };

  const tabs = [
    { key: 'templates' as const, label: 'Modèles', icon: MessageCircle },
    { key: 'sessions' as const, label: 'Sessions', icon: Globe },
    { key: 'stats' as const, label: 'Statistiques', icon: BarChart3 },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="WhatsApp Business"
        description="Gérez vos templates, sessions et messages WhatsApp"
        breadcrumbs={[{ label: 'Config & Intégrations' }, { label: 'WhatsApp' }]}
        actions={
          <>
            <LiveBadge label="Temps réel" />
            {activeTab === 'templates' && (
              <button
                onClick={() => setShowNewTemplate(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Nouveau template
              </button>
            )}
          </>
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

      {activeTab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucun template
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Créez votre premier template de message WhatsApp pour automatiser vos communications
                clients.
              </p>
            </Card>
          ) : (
            templates.map((t: any) => (
              <Card key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{t.name}</h3>
                    <Badge
                      variant={
                        t.status === 'APPROVED'
                          ? 'success'
                          : t.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {t.status || 'DRAFT'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.category} · {t.language} · {t.body?.substring(0, 80)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/whatsapp/${t.id}`}
                    className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Globe className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucune session
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Les conversations WhatsApp avec vos clients apparaîtront ici.
              </p>
            </Card>
          ) : (
            sessions.map((s: any) => (
              <Card key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {s.clientName || `Session #${s.id.substring(0, 6)}`}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {s._count?.messages || 0} messages ·{' '}
                    {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowSendMessage(s.id)}
                  className="px-3 py-1.5 text-sm bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Envoyer
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Templates',
              value: String(stats.templatesCount || 0),
              desc: 'Modèles de messages',
              icon: MessageCircle,
              color: 'text-blue-500',
            },
            {
              label: 'Sessions',
              value: String(stats.totalSessions || 0),
              desc: 'Conversations',
              icon: Globe,
              color: 'text-green-500',
            },
            {
              label: 'Messages',
              value: String(stats.totalMessages || 0),
              desc: 'Envoyés/reçus',
              icon: Send,
              color: 'text-purple-500',
            },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Nouveau template */}
      <Modal
        open={showNewTemplate}
        onClose={() => setShowNewTemplate(false)}
        title="Nouveau template WhatsApp"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom
            </label>
            <input
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="commande_confirmee"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <Select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                options={[
                  { value: 'MARKETING', label: 'Marketing' },
                  { value: 'UTILITY', label: 'Utilitaire' },
                  { value: 'AUTHENTICATION', label: 'Authentification' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Langue
              </label>
              <Select
                value={newTemplate.language}
                onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                options={[
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'Anglais' },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Corps du message
            </label>
            <textarea
              value={newTemplate.body}
              onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Bonjour {{1}}, votre commande {{2}} est confirmée !"
            />
          </div>
          <button
            onClick={handleCreateTemplate}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Créer le template
          </button>
        </div>
      </Modal>

      {/* Modal: Envoyer message */}
      <Modal
        open={!!showSendMessage}
        onClose={() => setShowSendMessage(null)}
        title="Envoyer un message"
      >
        <div className="space-y-4">
          <textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            placeholder="Votre message..."
          />
          <button
            onClick={() => showSendMessage && handleSendMessage(showSendMessage)}
            disabled={sendingMsg || !messageContent.trim()}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {sendingMsg ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTemplate}
        title="Supprimer le template"
        description="Êtes-vous sûr de vouloir supprimer ce template WhatsApp ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
