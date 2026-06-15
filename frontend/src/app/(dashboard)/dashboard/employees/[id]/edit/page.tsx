'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyEmployee, useUpdateEmployee, useEmployeeRoles } from '@/features/hooks';

export default function EditEmployeePage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: employee, isLoading, error, refetch } = useMyEmployee(id);
  const { data: roles } = useEmployeeRoles();
  const updateEmployee = useUpdateEmployee();
  const [form, setForm] = useState<any>({});

  const rolesList: { id: string; name: string }[] = Array.isArray(roles)
    ? roles
    : roles?.roles || roles?.data || [];

  useEffect(() => {
    if (employee) {
      const e: any = employee;
      setForm({
        firstName: e.firstName || '',
        lastName: e.lastName || '',
        email: e.email || '',
        phone: e.phone || '',
        roleId: e.roleId || '',
        position: e.position || '',
        department: e.department || '',
        salary: e.salary?.toString() || '',
        hireDate: e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : '',
      });
    }
  }, [employee]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!employee) return <p className="text-center py-12 text-gray-500">Employé introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updateEmployee.mutateAsync({
        id,
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          roleId: form.roleId || undefined,
          position: form.position || undefined,
          department: form.department || undefined,
          salary: form.salary ? parseFloat(form.salary) : undefined,
          hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : undefined,
        },
      });
      router.push('/dashboard/employees');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier l'employé" description="Mettez à jour les informations du membre"
        breadcrumbs={[{ label: 'Employés', href: '/dashboard/employees' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/employees/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
              <input type="text" value={form.firstName || ''} onChange={e => update('firstName', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input type="text" value={form.lastName || ''} onChange={e => update('lastName', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input type="email" value={form.email || ''} onChange={e => update('email', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input type="tel" value={form.phone || ''} onChange={e => update('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
              <select value={form.roleId || ''} onChange={e => update('roleId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                <option value="">Sélectionner un rôle</option>
                {rolesList.map((role: { id: string; name: string }) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
              <input type="text" value={form.position || ''} onChange={e => update('position', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Département</label>
              <input type="text" value={form.department || ''} onChange={e => update('department', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire (FCFA)</label>
              <input type="number" value={form.salary || ''} onChange={e => update('salary', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d&apos;embauche</label>
            <input type="date" value={form.hireDate || ''} onChange={e => update('hireDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href={`/dashboard/employees/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updateEmployee.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updateEmployee.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
