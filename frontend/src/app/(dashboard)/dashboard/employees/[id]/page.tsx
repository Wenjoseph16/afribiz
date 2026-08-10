'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Pencil,
  Trash2,
  Loader,
  Mail,
  Phone,
  Shield,
  CalendarDays,
  Briefcase,
  Building2,
  Wallet,
  History,
  TrendingUp,
  Activity,
  Clock,
  Award,
  Download,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useMyEmployee, useDeleteEmployee } from '@/features/hooks';

const statusConfig = {
  ACTIVE: { label: 'Actif', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  INACTIVE: { label: 'Inactif', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  SUSPENDED: { label: 'Suspendu', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

type DetailTab = 'info' | 'history';

function getInitials(first: string, last: string) {
  return `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase();
}

function isNewEmployee(hireDate?: string) {
  if (!hireDate) return false;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return new Date(hireDate) > thirtyDaysAgo;
}

function isSeniorEmployee(hireDate?: string) {
  if (!hireDate) return false;
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  return new Date(hireDate) < oneYearAgo;
}

function isManager(position?: string) {
  if (!position) return false;
  const managerKeywords = [
    'manager',
    'chef',
    'responsable',
    'supervisor',
    'lead',
    'directeur',
    'head',
  ];
  return managerKeywords.some((k) => position.toLowerCase().includes(k));
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const { data: employee, isLoading, error, refetch } = useMyEmployee(id);
  const deleteEmployee = useDeleteEmployee();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const now = new Date();
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipPeriod, setPayslipPeriod] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  if (!params?.id) return null;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (!employee)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Employé introuvable</p>
      </div>
    );

  const e: any = employee;
  const status = statusConfig[e.status as keyof typeof statusConfig] || statusConfig.INACTIVE;
  const hireDate = e.hireDate ? new Date(e.hireDate) : null;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteEmployee.mutateAsync(id);
      router.push('/dashboard/employees');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const infoRow = (
    icon: React.ReactNode,
    label: string,
    value: string | number | null | undefined
  ) => (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title={`${e.firstName} ${e.lastName}`}
        description={e.role?.name || 'Employé'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Équipe', href: '/dashboard/employees' },
          { label: `${e.firstName} ${e.lastName}` },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', status.class)}>
              {status.label}
            </span>
            {isNewEmployee(e.hireDate) && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300">
                🆕 Nouveau
              </span>
            )}
            {isSeniorEmployee(e.hireDate) && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300">
                ⭐ Ancien
              </span>
            )}
            {isManager(e.position) && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300">
                👔 Manager
              </span>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowPayslipModal(true)}>
              <Download className="h-4 w-4 mr-1.5" />
              Fiche de paie
            </Button>
            <Link href={`/dashboard/employees/${id}/edit`}>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-1.5" />
                Modifier
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1">
        {(
          [
            { key: 'info', label: 'Informations', icon: Shield },
            { key: 'history', label: 'Historique', icon: History },
          ] as { key: DetailTab; label: string; icon: any }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Contact
            </h3>
            <div className="space-y-4">
              {infoRow(<Mail className="h-4 w-4" />, 'Email', e.email)}
              {infoRow(<Phone className="h-4 w-4" />, 'Téléphone', e.phone)}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Emploi
            </h3>
            <div className="space-y-4">
              {infoRow(<Briefcase className="h-4 w-4" />, 'Poste', e.position)}
              {infoRow(<Building2 className="h-4 w-4" />, 'Département', e.department)}
              {infoRow(
                <Wallet className="h-4 w-4" />,
                'Salaire',
                e.salary ? `${Number(e.salary).toLocaleString()} FCFA` : null
              )}
              {infoRow(
                <CalendarDays className="h-4 w-4" />,
                "Date d'embauche",
                hireDate
                  ? hireDate.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : null
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
                  <CalendarDays className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date d'embauche</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {hireDate
                      ? hireDate.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ancienneté</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {hireDate
                      ? (() => {
                          const diff = now.getTime() - hireDate.getTime();
                          const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
                          const months = Math.floor(
                            (diff % (365.25 * 24 * 60 * 60 * 1000)) / (30 * 24 * 60 * 60 * 1000)
                          );
                          if (years >= 1)
                            return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
                          if (months >= 1) return `${months} mois`;
                          return "Moins d'un mois";
                        })()
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {status.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Département</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {e.department || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Chronologie
            </h3>
            <div className="space-y-3">
              {[
                {
                  date: e.createdAt ? new Date(e.createdAt) : null,
                  label: 'Profil créé',
                  icon: History,
                },
                { date: hireDate, label: 'Embauche', icon: Briefcase },
                {
                  date: e.updatedAt ? new Date(e.updatedAt) : null,
                  label: 'Dernière modification',
                  icon: TrendingUp,
                },
              ]
                .filter((item) => item.date)
                .map((item, i, arr) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          i === 0
                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.date?.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Télécharger fiche de paie
              </h3>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">Sélectionnez la période souhaitée.</p>
            <input
              type="month"
              value={payslipPeriod}
              onChange={(e) => setPayslipPeriod(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPayslipModal(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const token = useAuthStore.getState().accessToken;
                  const url = `${window.location.origin}/api/business/employees/${id}/payslip?period=${payslipPeriod}`;
                  const fullUrl = token ? `${url}&token=${encodeURIComponent(token)}` : url;
                  window.open(fullUrl, '_blank');
                  setShowPayslipModal(false);
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Supprimer cet employé ?"
        description="Cette action est irréversible. L'employé sera définitivement supprimé."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}
