'use client';

import { useState } from 'react';
import {
  Bell, Plus, Search, X, Pencil, Trash2, ToggleLeft, ToggleRight,
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

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'In-App',
};

const CHANNEL_VARIANTS: Record<string, 'brand' | 'warning' | 'success' | 'info'> = {
  EMAIL: 'brand',
  SMS: 'warning',
  WHATSAPP: 'success',
  IN_APP: 'info',
};

interface NotificationTemplate {
  id: string;
  type: string;
  channel: string;
  subject: string;
  title: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

interface TemplateForm {
  type: string;
  channel: string;
  subject: string;
  title: string;
  content: string;
  variables: string;
}

const defaultForm: TemplateForm = {
  type: '',
  channel: 'EMAIL',
  subject: '',
  title: '',
  content: '',
  variables: '',
};

function useTemplates() {
  return useQuery({
    queryKey: ['admin', 'notification-templates'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/notification-templates');
      return res.data.data as NotificationTemplate[];
    },
  });
}

function useTypes() {
  return useQuery({
    queryKey: ['admin', 'notification-types'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/notification-types');
      return res.data.data as string[];
    },
  });
}

function useChannels() {
  return useQuery({
    queryKey: ['admin', 'notification-channels'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/notification-channels');
      return res.data.data as string[];
    },
  });
}

export default function AdminNotificationTemplatesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<NotificationTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);

  const { data: templates, isLoading, error, refetch } = useTemplates();
  const { data: types, isLoading: typesLoading } = useTypes();
  const { data: channels, isLoading: channelsLoading } = useChannels();

  const createMutation = useMutation({
    mutationFn: (data: TemplateForm) =>
      apiClient.post('/admin/notification-templates', {
        ...data,
        variables: data.variables.split(',').map((v) => v.trim()).filter(Boolean),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notification-templates'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateForm> }) =>
      apiClient.put(`/admin/notification-templates/${id}`, {
        ...data,
        variables: data.variables ? data.variables.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notification-templates'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/notification-templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notification-templates'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/notification-templates/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notification-templates'] }); },
  });

  const openCreate = () => {
    setEditingTpl(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (tpl: NotificationTemplate) => {
    setEditingTpl(tpl);
    setForm({
      type: tpl.type,
      channel: tpl.channel,
      subject: tpl.subject || '',
      title: tpl.title || '',
      content: tpl.content,
      variables: (tpl.variables || []).join(', '),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTpl) {
        await updateMutation.mutateAsync({ id: editingTpl.id, data: form });
        setToast({ message: 'Template mis à jour avec succès', type: 'success' });
      } else {
        await createMutation.mutateAsync(form);
        setToast({ message: 'Template créé avec succès', type: 'success' });
      }
      setModalOpen(false);
    } catch {
      setToast({ message: "Erreur lors de l'enregistrement du template", type: 'error' });
    }
  };

  const handleDelete = async (tpl: NotificationTemplate) => {
    if (!window.confirm(`Supprimer le template « ${tpl.type} » (${CHANNEL_LABELS[tpl.channel]}) ?`)) return;
    try {
      await deleteMutation.mutateAsync(tpl.id);
      setToast({ message: 'Template supprimé avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleToggle = async (tpl: NotificationTemplate) => {
    try {
      await toggleMutation.mutateAsync(tpl.id);
      setToast({ message: `Template ${tpl.isActive ? 'désactivé' : 'activé'} avec succès`, type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors du basculement', type: 'error' });
    }
  };

  const tplList = Array.isArray(templates) ? (templates as NotificationTemplate[]) : [];
  const typesList = (Array.isArray(types) ? (types as string[]) : ['welcome_email', 'password_reset', 'account_verification', 'transaction_notification', 'promotional']);
  const channelsList = (Array.isArray(channels) ? (channels as string[]) : ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP']);

  const filteredList = tplList.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.type.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q) || t.channel.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={'p-3 rounded-xl text-sm font-medium ' + (
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <PageHeader
        title="Templates de notification"
        description="Gérez les modèles de notification pour tous les canaux"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Templates notification' },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouveau template
          </Button>
        }
      />

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par type, sujet ou canal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
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
        ) : filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Canal</th>
                  <th className="p-4 font-medium">Sujet</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tpl) => (
                  <tr key={tpl.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <Badge variant="purple" size="xs">{tpl.type.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={CHANNEL_VARIANTS[tpl.channel] || 'default'} size="xs">
                        {CHANNEL_LABELS[tpl.channel] || tpl.channel}
                      </Badge>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                      {tpl.subject || '-'}
                    </td>
                    <td className="p-4">
                      <Badge variant={tpl.isActive ? 'success' : 'warning'} size="xs">
                        {tpl.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggle(tpl)}
                          isLoading={toggleMutation.isPending}
                          title={tpl.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {tpl.isActive ? (
                            <ToggleLeft className="h-4 w-4 text-amber-500" />
                          ) : (
                            <ToggleRight className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => openEdit(tpl)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => handleDelete(tpl)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
            icon={<Bell className="h-8 w-8" />}
            title="Aucun template de notification"
            description={search ? 'Aucun template ne correspond à la recherche.' : 'Créez votre premier template de notification.'}
            action={!search ? <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Créer un template</Button> : undefined}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTpl ? 'Modifier le template' : 'Nouveau template de notification'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              disabled={typesLoading}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              <option value="">Sélectionner un type</option>
              {typesList.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Canal
            </label>
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
              required
              disabled={channelsLoading}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              {channelsList.map((c) => (
                <option key={c} value={c}>{CHANNEL_LABELS[c] || c}</option>
              ))}
            </select>
          </div>
          <Input
            label="Sujet"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Input
            label="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contenu
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 resize-none"
            />
          </div>
          <Input
            label="Variables (séparées par des virgules)"
            placeholder="ex: userName, email, link"
            value={form.variables}
            onChange={(e) => setForm({ ...form, variables: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingTpl ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
