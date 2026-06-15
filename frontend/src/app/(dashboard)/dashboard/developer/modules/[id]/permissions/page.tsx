'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, Plus, Trash2, Save,
  Lock, Unlock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useModulePermissions, useAddModulePermission, useRemoveModulePermission } from '@/features/developerModulesHooks';

const ACCESS_LEVELS = ['READ', 'WRITE', 'ADMIN'] as const;
const RESOURCES = [
  'PRODUCTS', 'SERVICES', 'BOOKINGS', 'ORDERS', 'CLIENTS',
  'CRM', 'MARKETING', 'PAYMENTS', 'ACCOUNTING', 'EMPLOYEES',
  'DELIVERIES', 'EVENTS', 'TRAININGS', 'RENTALS', 'SETTINGS',
  'DATA_EXPORT',
] as const;

const ACCESS_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  READ: 'success',
  WRITE: 'warning',
  ADMIN: 'danger',
};

const ACCESS_LABELS: Record<string, string> = {
  READ: 'Lecture',
  WRITE: 'Écriture',
  ADMIN: 'Admin',
};

export default function ModulePermissionsPage() {
  const params = useParams();
  const moduleId = params?.id as string;

  const { data: permissions, isLoading, error, refetch } = useModulePermissions(moduleId);
  const addPermission = useAddModulePermission();
  const removePermission = useRemoveModulePermission();

  const [showForm, setShowForm] = useState(false);
  const [newResource, setNewResource] = useState<string>('PRODUCTS');
  const [newAccess, setNewAccess] = useState<string>('READ');
  const [newDescription, setNewDescription] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const permissionList = useMemo(() => {
    if (!permissions) return [];
    return Array.isArray(permissions) ? permissions : [];
  }, [permissions]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof permissionList> = {};
    for (const p of permissionList) {
      const level = p.accessLevel;
      if (!groups[level]) groups[level] = [];
      groups[level].push(p);
    }
    return groups;
  }, [permissionList]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async () => {
    try {
      await addPermission.mutateAsync({
        moduleId,
        data: {
          resource: newResource,
          accessLevel: newAccess,
          description: newDescription || undefined,
        },
      });
      setShowForm(false);
      setNewDescription('');
      showToast('Permission ajoutée', 'success');
    } catch {
      showToast("Erreur lors de l'ajout", 'error');
    }
  };

  const handleRemove = async (permissionId: string) => {
    const confirmed = window.confirm('Supprimer cette permission ?');
    if (!confirmed) return;
    try {
      await removePermission.mutateAsync(permissionId);
      showToast('Permission supprimée', 'success');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Permissions du module</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gérez les ressources auxquelles ce module peut accéder
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {showForm ? 'Annuler' : 'Ajouter'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-2 border-brand/30">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ressource</label>
                <select
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all"
                >
                  {RESOURCES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Niveau d&apos;accès</label>
                <select
                  value={newAccess}
                  onChange={(e) => setNewAccess(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all"
                >
                  {ACCESS_LEVELS.map((a) => (
                    <option key={a} value={a}>{ACCESS_LABELS[a]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Input
                label="Description (optionnelle)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Pourquoi cette permission est nécessaire..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button variant="gradient" size="sm" onClick={handleAdd} isLoading={addPermission.isPending}>
                <Save className="h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Permissions by access level */}
      {permissionList.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-10 w-10" />}
          title="Aucune permission"
          description="Ce module ne déclare pas encore de permissions. Ajoutez-en pour définir les ressources auxquelles il peut accéder."
        />
      ) : (
        <div className="space-y-6">
          {(['ADMIN', 'WRITE', 'READ'] as const).map((level) => {
            const items = groupedPermissions[level] || [];
            if (items.length === 0) return null;
            return (
              <Card key={level} padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    level === 'ADMIN' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' :
                    level === 'WRITE' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' :
                    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                  )}>
                    {level === 'ADMIN' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Accès {ACCESS_LABELS[level]}
                    </h3>
                    <p className="text-xs text-gray-500">{items.length} permission{items.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Shield className="h-4 w-4 text-brand shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.resource}</span>
                          {p.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={ACCESS_VARIANTS[p.accessLevel] || 'default'} size="xs">
                          {ACCESS_LABELS[p.accessLevel] || p.accessLevel}
                        </Badge>
                        {p.isRequired && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">Requis</span>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => handleRemove(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
