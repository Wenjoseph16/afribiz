'use client';

import { useState } from 'react';
import {
  Shield, Users, FileText, Activity, CheckCircle, XCircle,
  PauseCircle, RefreshCw, BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import {
  useAdminGetPartners, useAdminApprovePartner, useAdminSuspendPartner,
  useAdminRevokePartner, useAdminGetDataAccessLogs, useAdminGetReports,
  useAdminGetPlatformAnalytics, useAdminRecomputeAllScores,
} from '@/features/afriScoreHooks';

type AdminTab = 'partners' | 'logs' | 'reports' | 'analytics';

export default function AdminDataHubPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const isAdmin = user?.roles?.includes('ADMIN');

  const tabs = [
    { id: 'analytics' as AdminTab, label: 'Analytiques', icon: BarChart3 },
    { id: 'partners' as AdminTab, label: 'Partenaires', icon: Users },
    { id: 'logs' as AdminTab, label: 'Logs d\'accès', icon: Activity },
    { id: 'reports' as AdminTab, label: 'Rapports', icon: FileText },
  ];

  const { data: analytics } = useAdminGetPlatformAnalytics();
  const { data: partnersData } = useAdminGetPartners({ limit: 50 });
  const { data: logsData } = useAdminGetDataAccessLogs({ limit: 50 });
  const { data: reportsData } = useAdminGetReports({ limit: 50 });
  const approveMutation = useAdminApprovePartner();
  const suspendMutation = useAdminSuspendPartner();
  const revokeMutation = useAdminRevokePartner();
  const recomputeAllMutation = useAdminRecomputeAllScores();

  const partners = Array.isArray(partnersData) ? partnersData : partnersData?.partners ?? [];
  const logs = Array.isArray(logsData) ? logsData : logsData?.logs ?? [];
  const reports = Array.isArray(reportsData) ? reportsData : reportsData?.reports ?? [];

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration Data Hub
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Admin Data Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion des partenaires, logs et rapports
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => recomputeAllMutation.mutate()}
          isLoading={recomputeAllMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />
          Recalculer tous les scores
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Plateforme
            </h3>
            {analytics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalBusinesses ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Businesses</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalPartners ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Partenaires</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalReports ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Rapports générés</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalAccessLogs ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Accès API</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.activeConsents ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Consentements actifs</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-emerald-600">{analytics.avgScore ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Score moyen</p>
                </div>
              </div>
            ) : (
              <Loader className="py-8" />
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Actions rapides
            </h3>
            <div className="space-y-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => recomputeAllMutation.mutate()}
                isLoading={recomputeAllMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                Recalculer tous les AfriScores
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Partners */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          {partners.length > 0 ? partners.map((partner: any) => (
            <Card key={partner.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{partner.name}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        partner.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        partner.status === 'SUSPENDED' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{partner.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{partner.type} · {partner.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-400">API: {partner.apiKey?.slice(0, 8)}...</span>
                      <span className="text-[10px] text-gray-400">{partner.requestCount ?? 0} requêtes</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {partner.status === 'PENDING' && (
                    <Button variant="primary" size="xs" onClick={() => approveMutation.mutate(partner.id)}>
                      <CheckCircle className="h-3 w-3" />
                      Approuver
                    </Button>
                  )}
                  {partner.status === 'ACTIVE' && (
                    <Button variant="secondary" size="xs" onClick={() => suspendMutation.mutate(partner.id)}>
                      <PauseCircle className="h-3 w-3" />
                      Suspendre
                    </Button>
                  )}
                  {(partner.status === 'ACTIVE' || partner.status === 'SUSPENDED') && (
                    <Button variant="ghost" size="xs" onClick={() => revokeMutation.mutate(partner.id)}>
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )) : (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Aucun partenaire"
              description="Les partenaires Data Hub apparaîtront ici une fois inscrits."
            />
          )}
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Partenaire</th>
                    <th className="pb-2 font-medium">Action</th>
                    <th className="pb-2 font-medium">Business</th>
                    <th className="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2.5 text-gray-900 dark:text-gray-100">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="py-2.5">{log.partner?.name || log.partnerId?.slice(0, 8)}</td>
                      <td className="py-2.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{log.action}</span>
                      </td>
                      <td className="py-2.5 text-gray-500">{log.business?.name || log.businessId?.slice(0, 8) || '-'}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium ${
                          log.status === 'SUCCESS' ? 'text-emerald-600' : 'text-red-600'
                        }`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title="Aucun log"
              description="Les logs d'accès API apparaîtront ici."
            />
          )}
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report: any) => (
                <Card key={report.id}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      report.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      report.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{report.status}</span>
                    <span className="text-[10px] text-gray-400">{report.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{report.title || `Rapport ${report.type}`}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Partenaire: {report.partner?.name || report.partnerId?.slice(0, 8)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString('fr-FR') : ''}
                    {report.price ? ` · ${Number(report.price).toLocaleString()} FCFA` : ''}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Aucun rapport"
              description="Les rapports commandés apparaîtront ici."
            />
          )}
        </div>
      )}
    </div>
  );
}
