'use client';

import { useState } from 'react';
import {
  FileText, Plus, Search, X, Pencil, Trash2, Send, LayoutGrid, FolderTree,
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

const PAGE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const PAGE_STATUS_LABELS: Record<string, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };
const PAGE_STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'default'> = { DRAFT: 'warning', PUBLISHED: 'success', ARCHIVED: 'default' };

interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: string;
  category?: Category;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

interface PageForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: string;
  tags: string;
}

const defaultPageForm: PageForm = { title: '', slug: '', content: '', excerpt: '', categoryId: '', tags: '' };

interface CategoryForm {
  name: string;
  slug: string;
  sortOrder: number;
}

const defaultCategoryForm: CategoryForm = { name: '', slug: '', sortOrder: 0 };

function usePages() {
  return useQuery({
    queryKey: ['admin', 'cms', 'pages'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/cms/pages');
      return res.data.data as CMSPage[];
    },
  });
}

function useCategories() {
  return useQuery({
    queryKey: ['admin', 'cms', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/cms/categories');
      return res.data.data as Category[];
    },
  });
}

export default function AdminCMSPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('pages');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [pageForm, setPageForm] = useState<PageForm>(defaultPageForm);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(defaultCategoryForm);

  const { data: pages, isLoading: pagesLoading, error: pagesError, refetch: refetchPages } = usePages();
  const { data: categories, isLoading: catsLoading, error: catsError, refetch: refetchCats } = useCategories();

  const createPageMutation = useMutation({
    mutationFn: (data: PageForm) => apiClient.post('/admin/cms/pages', { ...data, tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }); },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PageForm> }) =>
      apiClient.put(`/admin/cms/pages/${id}`, { ...data, tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }); },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/cms/pages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }); },
  });

  const publishPageMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/cms/pages/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] }); },
  });

  const createCatMutation = useMutation({
    mutationFn: (data: CategoryForm) => apiClient.post('/admin/cms/categories', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'categories'] }); },
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryForm> }) => apiClient.put(`/admin/cms/categories/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'categories'] }); },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/cms/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'cms', 'categories'] }); },
  });

  const openCreatePage = () => {
    setEditingPage(null);
    setPageForm(defaultPageForm);
    setPageModalOpen(true);
  };

  const openEditPage = (page: CMSPage) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt,
      categoryId: page.categoryId || '',
      tags: (page.tags || []).join(', '),
    });
    setPageModalOpen(true);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await updatePageMutation.mutateAsync({ id: editingPage.id, data: pageForm });
        setToast({ message: 'Page mise à jour avec succès', type: 'success' });
      } else {
        await createPageMutation.mutateAsync(pageForm);
        setToast({ message: 'Page créée avec succès', type: 'success' });
      }
      setPageModalOpen(false);
    } catch {
      setToast({ message: 'Erreur lors de l\'enregistrement de la page', type: 'error' });
    }
  };

  const handleDeletePage = async (page: CMSPage) => {
    if (!window.confirm(`Supprimer la page « ${page.title} » ?`)) return;
    try {
      await deletePageMutation.mutateAsync(page.id);
      setToast({ message: 'Page supprimée avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handlePublishPage = async (page: CMSPage) => {
    try {
      await publishPageMutation.mutateAsync(page.id);
      setToast({ message: 'Page publiée avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la publication', type: 'error' });
    }
  };

  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm(defaultCategoryForm);
    setCatModalOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder });
    setCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await updateCatMutation.mutateAsync({ id: editingCat.id, data: catForm });
        setToast({ message: 'Catégorie mise à jour avec succès', type: 'success' });
      } else {
        await createCatMutation.mutateAsync(catForm);
        setToast({ message: 'Catégorie créée avec succès', type: 'success' });
      }
      setCatModalOpen(false);
    } catch {
      setToast({ message: 'Erreur lors de l\'enregistrement de la catégorie', type: 'error' });
    }
  };

  const handleDeleteCat = async (cat: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${cat.name} » ?`)) return;
    try {
      await deleteCatMutation.mutateAsync(cat.id);
      setToast({ message: 'Catégorie supprimée avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const pageList = Array.isArray(pages) ? (pages as CMSPage[]) : [];
  const catList = Array.isArray(categories) ? (categories as Category[]) : [];
  const catMap = new Map(catList.map((c) => [c.id, c]));

  const filteredPages = pageList.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
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
        title="Gestion CMS"
        description="Gérez les pages et catégories du site"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'CMS' },
        ]}
      />

      <Tabs
        tabs={[
          { id: 'pages', label: 'Pages', icon: <FileText className="h-4 w-4" /> },
          { id: 'categories', label: 'Catégories', icon: <FolderTree className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />

      {activeTab === 'pages' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre ou slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <Button onClick={openCreatePage}>
              <Plus className="h-4 w-4" />
              Nouvelle page
            </Button>
          </div>

          <Card padding="none">
            {pagesLoading ? (
              <Loader className="py-20" />
            ) : pagesError ? (
              <ErrorState onRetry={refetchPages} />
            ) : filteredPages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Titre</th>
                      <th className="p-4 font-medium">Slug</th>
                      <th className="p-4 font-medium">Catégorie</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{page.title}</td>
                        <td className="p-4">
                          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{page.slug}</code>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{page.category?.name || catMap.get(page.categoryId)?.name || '-'}</td>
                        <td className="p-4">
                          <Badge variant={PAGE_STATUS_VARIANTS[page.status]} size="xs">
                            {PAGE_STATUS_LABELS[page.status]}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => openEditPage(page)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {page.status === 'DRAFT' && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handlePublishPage(page)}
                                isLoading={publishPageMutation.isPending}
                              >
                                <Send className="h-3.5 w-3.5 text-brand" />
                              </Button>
                            )}
                            <Button variant="ghost" size="xs" onClick={() => handleDeletePage(page)}>
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
                icon={<FileText className="h-8 w-8" />}
                title="Aucune page"
                description={search ? 'Aucune page ne correspond à la recherche.' : 'Créez votre première page CMS.'}
                action={!search ? <Button size="sm" onClick={openCreatePage}><Plus className="h-4 w-4" />Créer une page</Button> : undefined}
              />
            )}
          </Card>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreateCat}>
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </div>

          <Card padding="none">
            {catsLoading ? (
              <Loader className="py-20" />
            ) : catsError ? (
              <ErrorState onRetry={refetchCats} />
            ) : catList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Nom</th>
                      <th className="p-4 font-medium">Slug</th>
                      <th className="p-4 font-medium">Ordre</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catList.map((cat) => (
                      <tr key={cat.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{cat.name}</td>
                        <td className="p-4">
                          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{cat.slug}</code>
                        </td>
                        <td className="p-4 text-gray-500">{cat.sortOrder}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => openEditCat(cat)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleDeleteCat(cat)}>
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
                icon={<FolderTree className="h-8 w-8" />}
                title="Aucune catégorie"
                description="Créez votre première catégorie CMS."
                action={<Button size="sm" onClick={openCreateCat}><Plus className="h-4 w-4" />Créer une catégorie</Button>}
              />
            )}
          </Card>
        </>
      )}

      <Modal
        open={pageModalOpen}
        onClose={() => setPageModalOpen(false)}
        title={editingPage ? 'Modifier la page' : 'Nouvelle page CMS'}
        size="xl"
      >
        <form onSubmit={handlePageSubmit} className="space-y-4">
          <Input
            label="Titre"
            value={pageForm.title}
            onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
            required
          />
          <Input
            label="Slug"
            placeholder="ex: page-exemple"
            value={pageForm.slug}
            onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contenu
            </label>
            <textarea
              value={pageForm.content}
              onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
              rows={8}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 resize-none"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Extrait
            </label>
            <textarea
              value={pageForm.excerpt}
              onChange={(e) => setPageForm({ ...pageForm, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 resize-none"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Catégorie
            </label>
            <select
              value={pageForm.categoryId}
              onChange={(e) => setPageForm({ ...pageForm, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              <option value="">Aucune catégorie</option>
              {catList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Tags (séparés par des virgules)"
            placeholder="ex: actualité, guide, tutoriel"
            value={pageForm.tags}
            onChange={(e) => setPageForm({ ...pageForm, tags: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setPageModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createPageMutation.isPending || updatePageMutation.isPending}>
              {editingPage ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        size="md"
      >
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
          <Input
            label="Slug"
            placeholder="ex: actualites"
            value={catForm.slug}
            onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
            required
          />
          <Input
            label="Ordre de tri"
            type="number"
            value={String(catForm.sortOrder)}
            onChange={(e) => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCatModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createCatMutation.isPending || updateCatMutation.isPending}>
              {editingCat ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
