'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateEmployee, useEmployeeRoles } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();
  const { data: roles } = useEmployeeRoles();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    position: '',
    department: '',
    salary: '',
    hireDate: '',
  });

  const rolesList: { id: string; name: string }[] = Array.isArray(roles)
    ? roles
    : roles?.roles || roles?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        roleId: form.roleId || undefined,
        position: form.position || undefined,
        department: form.department || undefined,
        salary: form.salary ? parseFloat(form.salary) : undefined,
        hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : undefined,
      };
      await createEmployee.mutateAsync(payload);
      router.push('/dashboard/employees');
    } catch (err) { notifyError(err, 'Erreur', "Impossible de créer l'employé"); }
  };

  const notifyError = useNotifyError();

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouvel employé" description="Ajoutez un membre à votre équipe"
        breadcrumbs={[{ label: 'Employés', href: '/dashboard/employees' }, { label: 'Nouveau' }]}
        actions={<Link href="/dashboard/employees"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
              <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)} required placeholder="Jean"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)} required placeholder="Dupont"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="jean.dupont@exemple.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+225 01 02 03 04 05"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
              <select value={form.roleId} onChange={e => update('roleId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                <option value="">Sélectionner un rôle</option>
                {rolesList.map((role: { id: string; name: string }) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
              <input type="text" value={form.position} onChange={e => update('position', e.target.value)} placeholder="Ex: Développeur"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Département</label>
              <input type="text" value={form.department} onChange={e => update('department', e.target.value)} placeholder="Ex: IT"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire (FCFA)</label>
              <input type="number" value={form.salary} onChange={e => update('salary', e.target.value)} placeholder="Ex: 500000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d&apos;embauche</label>
            <input type="date" value={form.hireDate} onChange={e => update('hireDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/employees"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createEmployee.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createEmployee.isPending ? 'Création...' : 'Créer l\'employé'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
