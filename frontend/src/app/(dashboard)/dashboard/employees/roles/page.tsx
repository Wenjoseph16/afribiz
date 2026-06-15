'use client';

import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Save, X, Loader, Users, Lock, Key } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useEmployeeRoles } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const PERMISSION_LABELS: Record<string, string> = {
  view_products: 'Voir produits', edit_products: 'Modifier produits',
  view_orders: 'Voir commandes', edit_orders: 'Modifier commandes',
  view_bookings: 'Voir réservations', edit_bookings: 'Modifier réservations',
  view_clients: 'Voir clients', edit_clients: 'Modifier clients',
  view_finance: 'Voir finances', edit_finance: 'Modifier finances',
  manage_stock: 'Gérer stock', manage_employees: 'Gérer employés',
  view_reports: 'Voir rapports', manage_settings: 'Gérer paramètres',
};

const DEFAULT_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export default function EmployeeRolesPage() {
  const { data: rolesData, isLoading, refetch } = useEmployeeRoles();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', permissions: [] as string[] });
  const [deleting, setDeleting] = useState<string | null>(null);

  const roles: any[] = Array.isArray(rolesData) ? rolesData : (rolesData?.roles || rolesData?.data || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateEmployeeRole(editingId, form);
      } else {
        await apiClient.createEmployeeRole(form);
      }
      setShowCreate(false);
      setEditingId(null);
      setForm({ name: '', permissions: [] });
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await apiClient.deleteEmployeeRole(id); refetch(); } catch (err) { console.error(err); }
    setDeleting(null);
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const openEdit = (role: any) => {
    setEditingId(role.id);
    setForm({ name: role.name || '', permissions: role.permissions || [] });
    setShowCreate(true);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rôles & Permissions</h1><p className="text-sm text-gray-500">Gérez les rôles et droits d'accès de vos employés</p></div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm({ name: '', permissions: [] }); setShowCreate(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />Nouveau rôle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Shield className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Rôles</p><p className="text-lg font-bold">{roles.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><Lock className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Permissions totales</p><p className="text-lg font-bold">{DEFAULT_PERMISSIONS.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Key className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Moyenne / rôle</p><p className="text-lg font-bold">{roles.length > 0 ? Math.round(roles.reduce((s: number, r: any) => s + (r.permissions?.length || 0), 0) / roles.length) : 0}</p></div></div></Card>
      </div>

      {/* Roles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.length === 0 ? (
          <Card className="col-span-2 text-center py-12"><Shield className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun rôle créé</p></Card>
        ) : (
          roles.map((role: any) => (
            <Card key={role.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand/10"><Shield className="w-5 h-5 text-brand" /></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.permissions?.length || 0} permissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(role.id)} disabled={deleting === role.id} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(role.permissions || []).slice(0, 6).map((p: string) => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {PERMISSION_LABELS[p] || p}
                  </span>
                ))}
                {(role.permissions?.length || 0) > 6 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand">+{role.permissions.length - 6}</span>
                )}
              </div>
              <div className="mt-3 text-[10px] text-gray-400">
                {role.employeeCount || role._count?.employees || 0} employé(s) avec ce rôle
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{editingId ? 'Modifier le rôle' : 'Nouveau rôle'}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom du rôle *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="Ex: Manager, Caissier, Livreur..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEFAULT_PERMISSIONS.map(perm => (
                    <label key={perm} className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors',
                      form.permissions.includes(perm)
                        ? 'border-brand bg-brand/5 text-brand font-medium'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    )}>
                      <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePermission(perm)} className="sr-only" />
                      <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center', form.permissions.includes(perm) ? 'bg-brand border-brand' : 'border-gray-300 dark:border-gray-600')}>
                        {form.permissions.includes(perm) && <span className="text-white text-[8px]">✓</span>}
                      </div>
                      {PERMISSION_LABELS[perm]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" disabled={!form.name} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
