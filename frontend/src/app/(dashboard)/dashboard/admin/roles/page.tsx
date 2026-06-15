'use client';

import { useState, useMemo } from 'react';
import {
  Shield, Plus, Settings, Users, UserCog, Trash2, Check,
  X, Search, Save, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const RESOURCES = [
  'users', 'businesses', 'modules', 'ads',
  'finance', 'settings', 'media', 'reports',
  'subscriptions', 'support',
];

const RESOURCE_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  modules: 'Modules',
  ads: 'Publicités',
  finance: 'Finance',
  settings: 'Paramètres',
  media: 'Média',
  reports: 'Signalements',
  subscriptions: 'Abonnements',
  support: 'Support',
};

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'BAN', 'EXPORT', 'CONFIGURE'];

const ACTION_LABELS: Record<string, string> = {
  READ: 'Lecture',
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  APPROVE: 'Approbation',
  REJECT: 'Rejet',
  SUSPEND: 'Suspension',
  BAN: 'Bannissement',
  EXPORT: 'Export',
  CONFIGURE: 'Configuration',
};

const MOCK_ROLES = [
  { id: '1', name: 'Super Admin', description: 'Accès complet à toutes les fonctionnalités', isSystem: true, userCount: 2 },
  { id: '2', name: 'Finance', description: 'Gestion financière et transactions', isSystem: true, userCount: 3 },
  { id: '3', name: 'Support', description: 'Support client et gestion des tickets', isSystem: true, userCount: 5 },
  { id: '4', name: 'Modération', description: 'Modération des contenus et signalements', isSystem: true, userCount: 4 },
  { id: '5', name: 'Marketing', description: 'Campagnes marketing et publicités', isSystem: false, userCount: 2 },
  { id: '6', name: 'Product', description: 'Gestion des produits et fonctionnalités', isSystem: false, userCount: 1 },
];

const MOCK_PERMISSIONS: Record<string, string[]> = {
  '1': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'BAN', 'EXPORT', 'CONFIGURE'],
  '2': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
  '3': ['READ', 'UPDATE', 'APPROVE', 'REJECT', 'SUSPEND'],
  '4': ['READ', 'UPDATE', 'APPROVE', 'REJECT', 'SUSPEND', 'BAN'],
  '5': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'],
  '6': ['READ', 'CREATE', 'UPDATE', 'DELETE'],
};

const MOCK_PERMISSION_GRID: Record<string, Record<string, boolean>> = {
  '1': { READ: true, CREATE: true, UPDATE: true, DELETE: true, APPROVE: true, REJECT: true, SUSPEND: true, BAN: true, EXPORT: true, CONFIGURE: true },
  '2': { READ: true, CREATE: true, UPDATE: true, DELETE: true, APPROVE: false, REJECT: false, SUSPEND: false, BAN: false, EXPORT: true, CONFIGURE: false },
  '3': { READ: true, CREATE: false, UPDATE: true, DELETE: false, APPROVE: true, REJECT: true, SUSPEND: true, BAN: false, EXPORT: false, CONFIGURE: false },
  '4': { READ: true, CREATE: false, UPDATE: true, DELETE: false, APPROVE: true, REJECT: true, SUSPEND: true, BAN: true, EXPORT: false, CONFIGURE: false },
  '5': { READ: true, CREATE: true, UPDATE: true, DELETE: true, APPROVE: false, REJECT: false, SUSPEND: false, BAN: false, EXPORT: true, CONFIGURE: false },
  '6': { READ: true, CREATE: true, UPDATE: true, DELETE: true, APPROVE: false, REJECT: false, SUSPEND: false, BAN: false, EXPORT: false, CONFIGURE: false },
};

const MOCK_USERS: Record<string, any[]> = {
  '1': [
    { id: 'u1', name: 'Admin Principal', email: 'super@afribiz.com', roles: ['ADMIN'] },
    { id: 'u2', name: 'Admin Secondaire', email: 'admin2@afribiz.com', roles: ['ADMIN'] },
  ],
  '2': [
    { id: 'u3', name: 'Fatoumata Diallo', email: 'fatou@afribiz.com', roles: ['ADMIN'] },
    { id: 'u4', name: 'Moussa Koné', email: 'moussa@afribiz.com', roles: ['ADMIN'] },
    { id: 'u5', name: 'Aminata Traoré', email: 'amina@afribiz.com', roles: ['ADMIN'] },
  ],
  '3': [
    { id: 'u6', name: 'Ousmane Sissoko', email: 'ousmane@afribiz.com', roles: ['ADMIN'] },
  ],
};

function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/roles');
        return res.data.data;
      } catch {
        return MOCK_ROLES;
      }
    },
  });
}

function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users', 'admins'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users/admins');
        return res.data.data;
      } catch {
        return Object.values(MOCK_USERS).flat();
      }
    },
  });
}

export default function AdminRolesPage() {
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>('1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [assignUserId, setAssignUserId] = useState('');

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: adminUsers } = useAdminUsers();

  const roleList = Array.isArray(roles) ? roles : MOCK_ROLES;
  const allUsers = Array.isArray(adminUsers) ? adminUsers : Object.values(MOCK_USERS).flat();

  // Build permission grid from API or mock
  const [permGrid, setPermGrid] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = sessionStorage.getItem('admin_perm_grid');
    if (saved) return JSON.parse(saved);
    return MOCK_PERMISSION_GRID;
  });

  const selectedRole = roleList.find((r: any) => r.id === selectedRoleId) || null;
  const rolePermissions = selectedRoleId ? permGrid[selectedRoleId] || {} : {};
  const assignedUsers = selectedRoleId ? MOCK_USERS[selectedRoleId] || [] : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/roles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setShowCreateModal(false);
      setNewRole({ name: '', description: '' });
      setToast({ message: 'Rôle créé avec succès', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors de la création', type: 'error' }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiClient.post('/admin/roles/assign', { roleId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setShowAssignModal(false);
      setAssignUserId('');
      setToast({ message: 'Utilisateur assigné au rôle', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors de l\'assignation', type: 'error' }),
  });

  const unassignMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiClient.post('/admin/roles/unassign', { roleId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setToast({ message: 'Utilisateur retiré du rôle', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors du retrait', type: 'error' }),
  });

  const togglePermission = (resource: string, action: string) => {
    if (!selectedRoleId) return;
    if (selectedRole?.isSystem) return;

    setPermGrid((prev) => {
      const resourcePerms = { ...(prev[selectedRoleId]?.[resource] ? { [resource]: prev[selectedRoleId][resource] } : {}) };
      const actions = { ...((prev[selectedRoleId] as any)?.[resource] || {}) };
      actions[action] = !actions[action];
      const updated = {
        ...prev,
        [selectedRoleId]: {
          ...prev[selectedRoleId],
          [resource]: actions,
        },
      };
      try {
        apiClient.put(`/admin/roles/${selectedRoleId}`, { permissions: updated[selectedRoleId] });
      } catch {}
      return updated;
    });
  };

  const handleAssign = () => {
    if (!selectedRoleId || !assignUserId) return;
    assignMutation.mutate({ roleId: selectedRoleId, userId: assignUserId });
  };

  const handleUnassign = (userId: string, userName: string) => {
    if (!selectedRoleId) return;
    if (!window.confirm(`Retirer « ${userName} » de ce rôle ?`)) return;
    unassignMutation.mutate({ roleId: selectedRoleId, userId });
  };

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
        title="Gestion des rôles"
        description="Gérez les rôles administrateurs et leurs permissions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Rôles' },
        ]}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </Button>
        }
      />

      {rolesLoading ? (
        <Loader className="py-20" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Roles list */}
          <div className="lg:col-span-1 space-y-3">
            <Card title="Rôles" titleIcon={<UserCog className="h-4 w-4" />}>
              <div className="space-y-1">
                {roleList.map((role: any) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                      selectedRoleId === role.id
                        ? 'bg-brand text-white shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className={`h-4 w-4 ${selectedRoleId === role.id ? 'text-white' : 'text-gray-400'}`} />
                      <div>
                        <span className="font-semibold">{role.name}</span>
                        {role.isSystem && (
                          <Badge variant={selectedRoleId === role.id ? 'brand' : 'default'} size="xs" className="ml-2">
                            Système
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${selectedRoleId === role.id ? 'text-white/70' : 'text-gray-400'}`}>
                        {role.userCount || 0} membre{(role.userCount || 0) > 1 ? 's' : ''}
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 ${selectedRoleId === role.id ? 'text-white/70' : 'text-gray-300'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right panel - Role details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRole ? (
              <>
                {/* Role info */}
                <Card>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedRole.name}</h3>
                        {selectedRole.isSystem && <Badge variant="brand" size="xs">Système</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRole.description || 'Aucune description'}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(true)}>
                      <Plus className="h-4 w-4" />
                      Assigner
                    </Button>
                  </div>
                </Card>

                {/* Permissions grid */}
                <Card title="Permissions" titleIcon={<Settings className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 pr-4 font-medium">Ressource</th>
                          {ACTIONS.map((action) => (
                            <th key={action} className="pb-2 px-2 font-medium text-center whitespace-nowrap">
                              {ACTION_LABELS[action]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RESOURCES.map((resource) => (
                          <tr key={resource} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {RESOURCE_LABELS[resource]}
                            </td>
                            {ACTIONS.map((action) => {
                              const checked = !!(rolePermissions[resource] as any)?.[action as string];
                              return (
                                <td key={action} className="py-2.5 px-2 text-center">
                                  <button
                                    onClick={() => togglePermission(resource, action)}
                                    disabled={selectedRole?.isSystem}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                      checked
                                        ? 'bg-brand text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                                    } ${selectedRole?.isSystem ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80 cursor-pointer'}`}
                                  >
                                    {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!selectedRole?.isSystem && (
                    <div className="mt-4 flex justify-end">
                      <Button size="sm">
                        <Save className="h-4 w-4" />
                        Enregistrer
                      </Button>
                    </div>
                  )}
                </Card>

                {/* User assignments */}
                <Card
                  title="Utilisateurs assignés"
                  titleIcon={<Users className="h-4 w-4" />}
                  action={
                    <Button variant="secondary" size="xs" onClick={() => setShowAssignModal(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Assigner
                    </Button>
                  }
                >
                  {assignedUsers.length > 0 ? (
                    <div className="space-y-2">
                      {assignedUsers.map((u: any) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleUnassign(u.id, u.name)}
                            isLoading={unassignMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Users className="h-6 w-6" />}
                      title="Aucun utilisateur"
                      description="Aucun utilisateur assigné à ce rôle"
                    />
                  )}
                </Card>
              </>
            ) : (
              <EmptyState
                icon={<Shield className="h-8 w-8" />}
                title="Sélectionnez un rôle"
                description="Choisissez un rôle dans la liste de gauche pour voir ses détails"
              />
            )}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau rôle"
        description="Créez un nouveau rôle administrateur"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom du rôle"
            placeholder="Ex: Support technique"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              placeholder="Description du rôle..."
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(newRole)}
              isLoading={createMutation.isPending}
              disabled={!newRole.name.trim()}
            >
              <Plus className="h-4 w-4" />
              Créer le rôle
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssignUserId(''); }}
        title="Assigner un utilisateur"
        description={`Ajouter un utilisateur au rôle « ${selectedRole?.name || ''} »`}
        size="sm"
      >
        <div className="space-y-4">
          <select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Sélectionnez un utilisateur</option>
            {allUsers
              .filter((u: any) => !assignedUsers.find((au: any) => au.id === u.id))
              .map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowAssignModal(false); setAssignUserId(''); }}>Annuler</Button>
            <Button
              onClick={handleAssign}
              isLoading={assignMutation.isPending}
              disabled={!assignUserId}
            >
              <Users className="h-4 w-4" />
              Assigner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
