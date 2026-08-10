'use client';
import { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Download,
  Loader,
  FileText,
  User,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useMyEmployees } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PayrollPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: employeesData } = useMyEmployees({ limit: 200 });
  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData)
      ? employeesData
      : employeesData?.employees || employeesData?.data || [];
    return raw;
  }, [employeesData]);

  const {
    data: payrollData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee-payroll', statusFilter],
    queryFn: async () => {
      const res = await apiClient.get('/business/employees/payroll', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined, limit: 100 },
      });
      return res.data.data;
    },
  });

  const payrolls: any[] = useMemo(() => {
    const raw = payrollData?.items || payrollData?.data || [];
    return raw;
  }, [payrollData]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch('/business/employees/payroll/' + id + '/status', { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-payroll'] }),
  });

  const filtered = payrolls.filter((p: any) => {
    if (search) {
      const emp = employees.find((e: any) => e.id === p.employeeId);
      const name = emp?.name || emp?.firstName + ' ' + (emp?.lastName || '') || '';
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: payrolls.length,
    draft: payrolls.filter((p: any) => p.status === 'DRAFT').length,
    paid: payrolls.filter((p: any) => p.status === 'PAID').length,
    totalAmount: payrolls.reduce(
      (s: number, p: any) => s + Number(p.netAmount ?? p.netSalary ?? 0),
      0
    ),
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'DRAFT':
        return <Badge variant="warning">Brouillon</Badge>;
      case 'PAID':
        return <Badge variant="success">Payé</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Paies"
        description="Gérez les fiches de paie de vos employés"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employés', href: '/dashboard/employees' },
          { label: 'Paies' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Total fiches</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
          <p className="text-sm text-gray-500">Brouillons</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
          <p className="text-sm text-gray-500">Payées</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{Number(stats.totalAmount).toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500">Total net</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher employé..."
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'DRAFT', 'PAID'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                (statusFilter === s
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }
            >
              {s === 'ALL'
                ? 'Tous'
                : s === 'DRAFT'
                  ? 'Brouillon'
                  : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader className="h-8 w-8 animate-spin text-brand mx-auto" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="Aucune fiche de paie"
          description="Aucune fiche de paie pour le moment"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pay: any) => {
            const emp = employees.find((e: any) => e.id === pay.employeeId);
            return (
              <Card key={pay.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {emp?.name || emp?.firstName + ' ' + (emp?.lastName || '') || 'Employé'}
                        </p>
                        {statusBadge(pay.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pay.position || emp?.position || '-'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold">
                          {Number(pay.netAmount ?? pay.netSalary ?? 0).toLocaleString()} FCFA
                        </span>
                        <span className="text-xs text-gray-400">
                          {pay.periodStart
                            ? new Date(pay.periodStart).toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {pay.status === 'DRAFT' && (
                      <Button
                        size="xs"
                        onClick={() => statusMutation.mutate({ id: pay.id, status: 'PAID' })}
                      >
                        Marquer payé
                      </Button>
                    )}
                    <Button size="xs" variant="outline">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
