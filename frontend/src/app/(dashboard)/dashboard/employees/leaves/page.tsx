'use client';
import { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader,
  AlertTriangle,
  X,
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

export default function LeavesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    type: 'VACATION',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { data: employeesData } = useMyEmployees({ limit: 200 });
  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData)
      ? employeesData
      : employeesData?.employees || employeesData?.data || [];
    return raw;
  }, [employeesData]);

  const {
    data: leavesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee-leaves', statusFilter],
    queryFn: async () => {
      const res = await apiClient.get('/business/employees/leaves', {
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined, limit: 100 },
      });
      return res.data.data;
    },
  });

  const leaves: any[] = useMemo(() => {
    const d = leavesData as any;
    const raw = d?.items || d?.data || [];
    return raw;
  }, [leavesData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/business/employees/leaves', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-leaves'] });
      setShowCreate(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiClient.patch('/business/employees/leaves/' + id + '/status', { status, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-leaves'] }),
  });

  const filtered = leaves.filter((l: any) => {
    if (search) {
      const emp = employees.find((e: any) => e.id === l.employeeId);
      const name = emp?.name || emp?.firstName + ' ' + (emp?.lastName || '') || '';
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l: any) => l.status === 'PENDING').length,
    approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l: any) => l.status === 'REJECTED').length,
  };

  const typeLabels: Record<string, string> = {
    VACATION: 'Congés',
    SICK: 'Maladie',
    PERSONAL: 'Personnel',
    MATERNITY: 'Maternité',
    PATERNITY: 'Paternité',
    OTHER: 'Autre',
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approuvé</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejeté</Badge>;
      default:
        return <Badge>{s}</Badge>;
    }
  };

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Congés"
        description="Gérez les demandes de congés de vos employés"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Employés', href: '/dashboard/employees' },
          { label: 'Congés' },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouvelle demande
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">En attente</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approuvés</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-500">Rejetés</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un employé..."
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
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
                : s === 'PENDING'
                  ? 'En attente'
                  : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader className="h-8 w-8 animate-spin text-brand mx-auto" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="Aucun congé"
          description="Aucune demande de congé pour le moment"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((leave: any) => {
            const emp = employees.find((e: any) => e.id === leave.employeeId);
            return (
              <Card key={leave.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-purple-50">
                      <CalendarDays className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {emp?.name || emp?.firstName + ' ' + (emp?.lastName || '') || 'Employé'}
                        </p>
                        {statusBadge(leave.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {typeLabels[leave.type] || leave.type}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(leave.startDate).toLocaleDateString()} -{' '}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                      {leave.reason && <p className="text-xs text-gray-500 mt-1">{leave.reason}</p>}
                    </div>
                  </div>
                  {leave.status === 'PENDING' && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: leave.id, status: 'APPROVED' })}
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => statusMutation.mutate({ id: leave.id, status: 'REJECTED' })}
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Nouvelle demande de congé
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Employé *
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                  required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.firstName + ' ' + (emp.lastName || '')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Type de congé *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date début *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    required
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date fin *
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Motif
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none"
                  placeholder="Raison du congé..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || !form.employeeId || !form.startDate || !form.endDate
                  }
                  className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
