'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Wallet, TrendingUp, Download, Users } from 'lucide-react';
import { useMyEmployees } from '@/features/hooks';

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function PayrollPage() {
  const { data: employeesData, isLoading } = useMyEmployees();

  const employees = useMemo(() => {
    const raw = Array.isArray(employeesData) ? employeesData : employeesData?.employees || employeesData?.data || [];
    return raw.filter((e: any) => e.status === 'ACTIVE' && e.salary && Number(e.salary) > 0);
  }, [employeesData]);

  const stats = useMemo(() => {
    const total = employees.reduce((sum: number, e: any) => sum + Number(e.salary), 0);
    const avg = employees.length > 0 ? total / employees.length : 0;
    const max = employees.length > 0 ? Math.max(...employees.map((e: any) => Number(e.salary))) : 0;
    const min = employees.length > 0 ? Math.min(...employees.map((e: any) => Number(e.salary))) : 0;
    return { total, avg, max, min, count: employees.length };
  }, [employees]);

  const groupedByDepartment = useMemo(() => {
    const groups: Record<string, any[]> = {};
    employees.forEach((e: any) => {
      const dept = e.department || 'Non défini';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(e);
    });
    return groups;
  }, [employees]);

  const month = new Date().toISOString().slice(0, 7);

  const handleExportCSV = () => {
    const headers = ['Prénom', 'Nom', 'Email', 'Poste', 'Département', 'Salaire', 'Devise'];
    const rows = employees.map((e: any) => [
      e.firstName, e.lastName, e.email, e.position || '', e.department || '', Number(e.salary).toFixed(2), e.salaryCurrency || 'FCFA',
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paie-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loader className="py-12" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Paie & Salaires"
        description="Gérez les salaires de vos employés"
        actions={
          employees.length > 0 ? (
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              Exporter CSV
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(stats.total)}</p>
              <p className="text-xs text-gray-500">Masse salariale</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(stats.avg)}</p>
              <p className="text-xs text-gray-500">Salaire moyen</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(stats.max)}</p>
              <p className="text-xs text-gray-500">Salaire max</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.count}</p>
              <p className="text-xs text-gray-500">Employés actifs</p>
            </div>
          </div>
        </Card>
      </div>



      {employees.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="Aucun salaire à gérer"
          description="Ajoutez des employés avec un salaire pour commencer à gérer la paie"
        />
      ) : (
        <div className="space-y-6">
          {/* By department */}
          {Object.entries(groupedByDepartment).map(([dept, emps]) => {
            const deptTotal = emps.reduce((sum: number, e: any) => sum + Number(e.salary), 0);
            return (
              <div key={dept}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dept}</h3>
                  <span className="text-sm font-medium text-brand">{fmt(deptTotal)}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="p-3 font-medium">Employé</th>
                        <th className="p-3 font-medium">Poste</th>
                        <th className="p-3 font-medium">Salaire</th>
                        <th className="p-3 font-medium">Devise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emps.map((emp: any) => (
                        <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                            {emp.firstName} {emp.lastName}
                          </td>
                          <td className="p-3 text-gray-500">{emp.position || '-'}</td>
                          <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">{fmt(Number(emp.salary))}</td>
                          <td className="p-3 text-gray-500">{emp.salaryCurrency || 'FCFA'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
