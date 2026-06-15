'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Search, Eye, Pencil, Trash2,
  Shield, BadgeCheck, Phone, Loader,
  AlertTriangle, Zap, TrendingUp, Sparkles,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useMyEmployees, useDeleteEmployee, useEmployeeRoles, useEmployeeStats } from '@/features/hooks';

interface EmployeeItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: { name: string } | null;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt?: string;
  attendanceRate?: number;
}

type TabType = 'all' | 'active' | 'inactive';

function getInitials(first: string, last: string) {
  return `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase();
}

const statusConfig = {
  ACTIVE: { label: 'Actif', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  INACTIVE: { label: 'Inactif', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  SUSPENDED: { label: 'Suspendu', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export default function EmployeesPage() {
  const { data: employeesData, isLoading, error, refetch } = useMyEmployees();
  const { data: rolesData } = useEmployeeRoles();
  const { data: statsData } = useEmployeeStats();
  const deleteEmployee = useDeleteEmployee();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allEmployees: EmployeeItem[] = Array.isArray(employeesData)
    ? employeesData
    : employeesData?.employees || employeesData?.data || [];

  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.roles || rolesData?.data || [];

  const now = new Date();

  const stats = statsData || {
    total: allEmployees.length,
    active: allEmployees.filter(e => e.status === 'ACTIVE').length,
    rolesCount: roles.length,
    attendanceRate: 0,
  };

  const filtered = useMemo(() => {
    let f = [...allEmployees];
    switch (activeTab) {
      case 'active': f = f.filter(e => e.status === 'ACTIVE'); break;
      case 'inactive': f = f.filter(e => e.status === 'INACTIVE' || e.status === 'SUSPENDED'); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(e =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role?.name?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allEmployees, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet employé ?')) return;
    try { await deleteEmployee.mutateAsync(id); } catch (err) { console.error(err); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Employés</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre équipe et leurs rôles</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/employees/new">
            <Button size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Nouvel employé</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<BadgeCheck className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Actifs" value={stats.active} />
        <StatsCard icon={<Shield className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Rôles" value={stats.rolesCount ?? roles.length} />
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Présence" value={stats.attendanceRate ? `${stats.attendanceRate}%` : 'N/A'} />
      </div>

      {/* Suggestions intelligentes */}
      {allEmployees.length > 0 && (() => {
        const newHires = allEmployees.filter(e => e.hireDate && new Date(e.hireDate) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        const suspended = allEmployees.filter(e => e.status === 'SUSPENDED');
        const seniorEmployees = allEmployees.filter(e => e.hireDate && new Date(e.hireDate) < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000));
        const departments = [...new Set(allEmployees.map(e => e.department).filter(Boolean))];

        const suggestions = [
          newHires.length > 0 && {
            type: 'new_hires' as const,
            icon: Sparkles,
            title: `${newHires.length} nouvel${newHires.length > 1 ? 's' : ''} employé${newHires.length > 1 ? 's' : ''} récent${newHires.length > 1 ? 's' : ''}`,
            desc: 'Consultez leurs profils et assurez un bon onboarding',
            color: 'blue',
            link: `/dashboard/employees?status=new`,
          },
          suspended.length > 0 && {
            type: 'suspended' as const,
            icon: AlertTriangle,
            title: `${suspended.length} employé${suspended.length > 1 ? 's' : ''} suspendu${suspended.length > 1 ? 's' : ''}`,
            desc: 'Action requise — décidez de la réintégration ou du départ',
            color: 'amber',
            link: `/dashboard/employees?status=suspended`,
          },
          seniorEmployees.length > 0 && {
            type: 'senior' as const,
            icon: TrendingUp,
            title: `${seniorEmployees.length} anci${seniorEmployees.length > 1 ? 'ens' : 'en'} (${'>1 an d\'ancienneté'})`,
            desc: 'Valorisez leur expérience et expertise',
            color: 'emerald',
            link: `/dashboard/employees`,
          },
          departments.length > 0 && {
            type: 'departments' as const,
            icon: Zap,
            title: `${departments.length} département${departments.length > 1 ? 's' : ''} actif${departments.length > 1 ? 's' : ''}`,
            desc: departments.slice(0, 3).join(', ') + (departments.length > 3 ? ` et +${departments.length - 3}` : ''),
            color: 'purple',
            link: `/dashboard/employees/roles`,
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap = {
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i: number) => (
              <Link key={i} href={s.link}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color as keyof typeof colorMap]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        {/* Suggestions intelligentes intégrées */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['all', 'active', 'inactive'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Tous' : tab === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un employé..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />}
          title={searchQuery ? 'Aucun résultat' : 'Aucun employé'}
          description={searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier employé'}
          action={<Link href="/dashboard/employees/new"><Button><UserPlus className="h-4 w-4 mr-1.5" />Nouvel employé</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function getBadges(employee: EmployeeItem) {
  const badges: { label: string; class: string }[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const isNew = employee.hireDate && new Date(employee.hireDate) > thirtyDaysAgo;
  const isSenior = employee.hireDate && new Date(employee.hireDate) < oneYearAgo;
  if (isNew) badges.push({ label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' });
  if (isSenior) badges.push({ label: '⭐ Ancien', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' });
  if (employee.position?.toLowerCase().includes('manager') || employee.position?.toLowerCase().includes('chef') || employee.position?.toLowerCase().includes('responsable')) {
    badges.push({ label: '👔 Manager', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' });
  }
  return badges;
}

function EmployeeCard({ employee, onDelete }: { employee: EmployeeItem; onDelete: (id: string) => Promise<void> }) {
  const status = statusConfig[employee.status] || statusConfig.INACTIVE;
  const badges = getBadges(employee);

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/20 flex items-center justify-center shrink-0 text-sm font-bold text-brand dark:text-brand-400">
            {getInitials(employee.firstName, employee.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{employee.email}</p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {badges.map((b, i) => (
                  <span key={i} className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', b.class)}>
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-500">
          {employee.role && (
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{employee.role.name}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{employee.phone}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.class)}>
            {status.label}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/dashboard/employees/${employee.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/dashboard/employees/${employee.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => onDelete(employee.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
