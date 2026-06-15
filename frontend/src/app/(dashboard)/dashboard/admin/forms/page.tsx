'use client';

import { useState } from 'react';
import {
  ClipboardList, Plus, Search, X, Pencil, Trash2, ToggleLeft, ToggleRight,
  FileSpreadsheet, Eye,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

interface FormTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  schema: any;
  status: string;
  version: number;
  createdAt: string;
}

interface FormSubmission {
  id: string;
  templateId: string;
  data: any;
  createdAt: string;
}

interface TemplateForm {
  name: string;
  slug: string;
  description: string;
  category: string;
  schema: string;
}

const defaultTemplateForm: TemplateForm = { name: '', slug: '', description: '', category: '', schema: '{}' };

function useTemplates() {
  return useQuery({
    queryKey: ['admin', 'forms', 'templates'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/forms/templates');
      return res.data.data as FormTemplate[];
    },
  });
}

function useSubmissions(templateId: string | null) {
  return useQuery({
    queryKey: ['admin', 'forms', 'submissions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const res = await apiClient.get(`/admin/forms/submissions/${templateId}`);
      return res.data.data as FormSubmission[];
    },
    enabled: !!templateId,
  });
}

export default function AdminFormsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(defaultTemplateForm);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { data: templates, isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useTemplates();
  const { data: submissions, isLoading: submissionsLoading } = useSubmissions(selectedTemplateId);

  const createMutation = useMutation({
    mutationFn: (data: TemplateForm) => apiClient.post('/admin/forms/templates', { ...data, schema: JSON.parse(data.schema || '{}') }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateForm> }) =>
      apiClient.put(`/admin/forms/templates/${id}`, { ...data, schema: data.schema ? JSON.parse(data.schema) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/forms/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] }); },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/forms/templates/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] }); },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/forms/templates/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'forms', 'templates'] }); },
  });

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(defaultTemplateForm);
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (tpl: FormTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      category: tpl.category,
      schema: typeof tpl.schema === 'string' ? tpl.schema : JSON.stringify(tpl.schema, null, 2),
    });
    setTemplateModalOpen(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, data: templateForm });
        setToast({ message: 'Template mis à jour avec succès', type: 'success' });
      } else {
        await createMutation.mutateAsync(templateForm);
        setToast({ message: 'Template créé avec succès', type: 'success' });
      }
      setTemplateModalOpen(false);
    } catch {
      setToast({ message: 'Erreur lors de l\'enregistrement du template', type: 'error' });
    }
  };

  const handleDeleteTemplate = async (tpl: FormTemplate) => {
    if (!window.confirm(`Supprimer le template « ${tpl.name} » ?`)) return;
    try {
      await deleteMutation.mutateAsync(tpl.id);
      setToast({ message: 'Template supprimé avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleActivate = async (id: string, activate: boolean) => {
    try {
      if (activate) {
        await activateMutation.mutateAsync(id);
      } else {
        await deactivateMutation.mutateAsync(id);
      }
      setToast({ message: `Template ${activate ? 'activé' : 'désactivé'} avec succès`, type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors du changement de statut', type: 'error' });
    }
  };

  const templateList = Array.isArray(templates) ? (templates as FormTemplate[]) : [];
  const subList = Array.isArray(submissions) ? (submissions as FormSubmission[]) : [];

  const filteredTemplates = templateList.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
  });

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
        title="Gestion des formulaires"
        description="Gérez les templates de formulaires et consultez les soumissions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Formulaires' },
        ]}
      />

      <Tabs
        tabs={[
          { id: 'templates', label: 'Templates', icon: <ClipboardList className="h-4 w-4" /> },
          { id: 'submissions', label: 'Soumissions', icon: <FileSpreadsheet className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {activeTab === 'templates' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <Button onClick={openCreateTemplate}>
              <Plus className="h-4 w-4" />
              Nouveau template
            </Button>
          </div>

          <Card padding="none">
            {templatesLoading ? (
              <Loader className="py-20" />
            ) : templatesError ? (
              <ErrorState onRetry={refetchTemplates} />
            ) : filteredTemplates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Nom</th>
                      <th className="p-4 font-medium">Slug</th>
                      <th className="p-4 font-medium">Catégorie</th>
                      <th className="p-4 font-medium">Version</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((tpl) => (
                      <tr key={tpl.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</td>
                        <td className="p-4">
                          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{tpl.slug}</code>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{tpl.category || '-'}</td>
                        <td className="p-4 text-gray-500">v{tpl.version}</td>
                        <td className="p-4">
                          <Badge variant={tpl.status === 'ACTIVE' ? 'success' : 'default'} size="xs">
                            {tpl.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {tpl.status === 'ACTIVE' ? (
                              <Button variant="ghost" size="xs" onClick={() => handleActivate(tpl.id, false)}>
                                <ToggleLeft className="h-3.5 w-3.5 text-amber-500" />
                                Désactiver
                              </Button>
                            ) : (
                              <Button variant="ghost" size="xs" onClick={() => handleActivate(tpl.id, true)}>
                                <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                                Activer
                              </Button>
                            )}
                            <Button variant="ghost" size="xs" onClick={() => openEditTemplate(tpl)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleDeleteTemplate(tpl)}>
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
                icon={<ClipboardList className="h-8 w-8" />}
                title="Aucun template"
                description={search ? 'Aucun template ne correspond à la recherche.' : 'Créez votre premier template de formulaire.'}
                action={!search ? <Button size="sm" onClick={openCreateTemplate}><Plus className="h-4 w-4" />Créer un template</Button> : undefined}
              />
            )}
          </Card>
        </>
      )}

      {activeTab === 'submissions' && (
        <>
          <div className="w-full sm:max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sélectionner un template
            </label>
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => setSelectedTemplateId(e.target.value || null)}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              <option value="">Choisir un template...</option>
              {templateList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {selectedTemplateId ? (
            <Card padding="none">
              {submissionsLoading ? (
                <Loader className="py-20" />
              ) : subList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="p-4 font-medium">ID</th>
                        <th className="p-4 font-medium">Aperçu des données</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subList.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="p-4 text-xs font-mono text-gray-500">{sub.id.slice(0, 8)}...</td>
                          <td className="p-4 text-gray-500 max-w-[300px] truncate">
                            {JSON.stringify(sub.data).slice(0, 80)}...
                          </td>
                          <td className="p-4 text-xs text-gray-500">
                            {new Date(sub.createdAt).toLocaleString('fr-FR')}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => { setPreviewData(sub.data); setPreviewModalOpen(true); }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Voir
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={<FileSpreadsheet className="h-8 w-8" />}
                  title="Aucune soumission"
                  description="Ce template n'a pas encore reçu de soumission."
                />
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={<FileSpreadsheet className="h-8 w-8" />}
                title="Sélectionnez un template"
                description="Choisissez un template pour voir ses soumissions."
              />
            </Card>
          )}
        </>
      )}

      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={editingTemplate ? 'Modifier le template' : 'Nouveau template de formulaire'}
        size="xl"
      >
        <form onSubmit={handleTemplateSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            placeholder="ex: formulaire-contact"
            value={templateForm.slug}
            onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
          />
          <Input
            label="Catégorie"
            placeholder="ex: contact, inscription"
            value={templateForm.category}
            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Schéma JSON
            </label>
            <textarea
              value={templateForm.schema}
              onChange={(e) => setTemplateForm({ ...templateForm, schema: e.target.value })}
              rows={8}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 font-mono text-xs resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setTemplateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingTemplate ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Aperçu des données"
        size="lg"
      >
        <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(previewData, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}
