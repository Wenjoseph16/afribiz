'use client';

import { useState, useMemo } from 'react';
import { Shield, Plus, Settings, Users, UserCog, Trash2, Check, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';
import { AlertTriangle } from 'lucide-react';

const RESOURCES = [
  'users',
  'businesses',
  'modules',
  'ads',
  'finance',
  'settings',
  'media',
  'reports',
  'subscriptions',
  'support',
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

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'BAN'];

const ACTION_LABELS: Record<string, string> = {
  READ: 'Lecture',
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  APPROVE: 'Approbation',
  REJECT: 'Rejet',
  SUSPEND: 'Suspension',
  BAN: 'Bannissement',
};

interface AdminPermission {
  id: string;
  resource: string;
  action: string;
}

function useRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await apiClient.adminGetRoles();
      return res.data.data;
    },
  });
}

function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users', 'admins'],
    queryFn: async () => {
      const res = await apiClient.adminGetUsersAdmins();
      return res.data.data;
    },
  });
}

function usePermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/permissions');
      return res.data.data as AdminPermission[];
    },
  });
}

function permissionIdsForRole(role: any): Set<string> {
  const ids = new Set<string>();
  for (const p of role?.permissions || []) {
    const permId = p?.permission?.id || p?.permissionId;
    if (permId) ids.add(permId);
  }
  return ids;
}

export default function AdminRolesPage() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{ userId: string; userName: string } | null>(
    null
  );

  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [assignUserId, setAssignUserId] = useState('');

  const {
    data: roles,
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useRoles();
  const { data: adminUsers, isError: usersError, refetch: refetchUsers } = useAdminUsers();
  const { data: rawPermissions, isError: permsError, refetch: refetchPerms } = usePermissions();

  const roleList = Array.isArray(roles) ? roles : [];
  const allUsers = Array.isArray(adminUsers) ? adminUsers : [];

  const selectedRole = roleList.find((r: any) => r.id === selectedRoleId) || null;

  // Map (resource, action) -> permission id from the flat permission list
  const permissionIdByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const perm of Array.isArray(rawPermissions) ? rawPermissions : []) {
      map[`${perm.resource}_${perm.action}`] = perm.id;
    }
    return map;
  }, [rawPermissions]);

  const enabledIds = useMemo(
    () => (selectedRole ? permissionIdsForRole(selectedRole) : new Set<string>()),
    [selectedRole]
  );

  const assignedUsers = useMemo(
    () => allUsers.filter((u: any) => (u.roles || []).some((r: any) => r.id === selectedRoleId)),
    [allUsers, selectedRoleId]
  );

  const hasError = rolesError || usersError || permsError;
  const isLoading = rolesLoading;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.adminCreateRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setShowCreateModal(false);
      setNewRole({ name: '', description: '' });
      notify({ title: 'Rôle créé', variant: 'success' });
    },
    onError: () =>
      notify({
        title: 'Erreur',
        description: 'Échec de la création du rôle.',
        variant: 'error',
      }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiClient.adminAssignRole({ roleId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'admins'] });
      setShowAssignModal(false);
      setAssignUserId('');
      notify({ title: 'Utilisateur assigné au rôle', variant: 'success' });
    },
    onError: () =>
      notify({
        title: 'Erreur',
        description: "Échec de l'assignation.",
        variant: 'error',
      }),
  });

  const unassignMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      apiClient.adminUnassignRole({ roleId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users', 'admins'] });
      notify({ title: 'Utilisateur retiré du rôle', variant: 'success' });
    },
    onError: () => notify({ title: 'Erreur', description: 'Échec du retrait.', variant: 'error' }),
  });

  const permissionMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      apiClient.put(`/admin/roles/${roleId}`, { permissionIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
    onError: () =>
      notify({
        title: 'Erreur',
        description: 'Échec de la mise à jour des permissions.',
        variant: 'error',
      }),
  });

  const togglePermission = (resource: string, action: string) => {
    if (!selectedRole || !selectedRoleId || selectedRole.isSystem) return;
    const key = `${resource}_${action}`;
    const permId = permissionIdByKey[key];
    if (!permId) return;

    const next = new Set(enabledIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    permissionMutation.mutate({ roleId: selectedRoleId, permissionIds: [...next] });
  };

  const isEnabled = (resource: string, action: string) =>
    enabledIds.has(permissionIdByKey[`${resource}_${action}`] || '');

  const hasPermissionEntry = (resource: string, action: string) =>
    Boolean(permissionIdByKey[`${resource}_${action}`]);

  const handleAssign = () => {
    if (!selectedRoleId || !assignUserId) return;
    assignMutation.mutate({ roleId: selectedRoleId, userId: assignUserId });
  };

  const handleUnassign = (userId: string, userName: string) => {
    if (!selectedRoleId) return;
    setUnassignTarget({ userId, userName });
  };

  const retryAll = () => {
    refetchRoles();
    refetchUsers();
    refetchPerms();
  };

  return (
    <div className="space-y-6 animate-fade-in">
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

      {isLoading && rolesLoading ? (
        <Loader className="py-20" />
      ) : hasError ? (
        <Card padding="none">
          <ErrorState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Impossible de charger les rôles"
            message="Le service de gouvernance est injoignable. Vérifiez votre connexion ou réessayez."
            onRetry={retryAll}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Roles list */}
          <div className="lg:col-span-1 space-y-3">
            <Card title="Rôles" titleIcon={<UserCog className="h-4 w-4" />}>
              <div className="space-y-1">
                {roleList.length > 0 ? (
                  roleList.map((role: any) => (
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
                        <Shield
                          className={`h-4 w-4 ${selectedRoleId === role.id ? 'text-white' : 'text-gray-400'}`}
                        />
                        <div>
                          <span className="font-semibold">{role.name}</span>
                          {role.isSystem && (
                            <Badge
                              variant={selectedRoleId === role.id ? 'brand' : 'default'}
                              size="xs"
                              className="ml-2"
                            >
                              Système
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${selectedRoleId === role.id ? 'text-white/70' : 'text-gray-400'}`}
                        >
                          {role._count?.admins ?? 0} membre
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 ${selectedRoleId === role.id ? 'text-white/70' : 'text-gray-300'}`}
                        />
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    icon={<Shield className="h-6 w-6" />}
                    title="Aucun rôle"
                    description="Créez votre premier rôle administrateur."
                  />
                )}
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {selectedRole.name}
                        </h3>
                        {selectedRole.isSystem && (
                          <Badge variant="brand" size="xs">
                            Système
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedRole.description || 'Aucune description'}
                      </p>
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
                            <th
                              key={action}
                              className="pb-2 px-2 font-medium text-center whitespace-nowrap"
                            >
                              {ACTION_LABELS[action]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {RESOURCES.map((resource) => (
                          <tr
                            key={resource}
                            className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <td className="py-2.5 pr-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {RESOURCE_LABELS[resource]}
                            </td>
                            {ACTIONS.map((action) => {
                              const exists = hasPermissionEntry(resource, action);
                              const checked = exists && isEnabled(resource, action);
                              return exists ? (
                                <td key={action} className="py-2.5 px-2 text-center">
                                  <button
                                    onClick={() => togglePermission(resource, action)}
                                    disabled={selectedRole.isSystem || permissionMutation.isPending}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                      checked
                                        ? 'bg-brand text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600'
                                    } ${
                                      selectedRole.isSystem || permissionMutation.isPending
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:opacity-80 cursor-pointer'
                                    }`}
                                    title={selectedRole.isSystem ? 'Rôle système verrouillé' : ''}
                                  >
                                    <Check
                                      className={`h-3.5 w-3.5 ${checked ? '' : 'opacity-0'}`}
                                    />
                                  </button>
                                </td>
                              ) : (
                                <td key={action} className="py-2.5 px-2 text-center">
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedRole.isSystem && (
                    <p className="mt-3 text-xs text-gray-400">
                      Les rôles système sont verrouillés et ne peuvent pas être modifiés.
                    </p>
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
                      {assignedUsers.map((u: any) => {
                        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                        return (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                                {name[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {name}
                                </p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleUnassign(u.id, name)}
                              isLoading={unassignMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        );
                      })}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Description du rôle..."
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
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
        onClose={() => {
          setShowAssignModal(false);
          setAssignUserId('');
        }}
        title="Assigner un utilisateur"
        description={`Ajouter un utilisateur au rôle « ${selectedRole?.name || ''} »`}
        size="sm"
      >
        <div className="space-y-4">
          <Select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            placeholder="Sélectionnez un utilisateur"
            options={allUsers
              .filter((u: any) => !(u.roles || []).some((r: any) => r.id === selectedRoleId))
              .map((u: any) => ({
                value: u.id,
                label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
              }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignModal(false);
                setAssignUserId('');
              }}
            >
              Annuler
            </Button>
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

      <ConfirmationModal
        open={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        onConfirm={async () => {
          if (!unassignTarget || !selectedRoleId) return;
          await unassignMutation.mutateAsync({
            roleId: selectedRoleId,
            userId: unassignTarget.userId,
          });
          setUnassignTarget(null);
        }}
        title="Retirer l'utilisateur"
        description={`Êtes-vous sûr de vouloir retirer « ${unassignTarget?.userName} » de ce rôle ?`}
        confirmLabel="Retirer"
        variant="warning"
      />
    </div>
  );
}
