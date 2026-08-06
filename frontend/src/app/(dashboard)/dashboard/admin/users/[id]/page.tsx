'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Activity,
  LogIn,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Globe,
  Monitor,
  Smartphone,
  Clock,
  Snowflake,
  Flame,
  Eye,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/services/apiClient';
import { startImpersonation } from '@/lib/impersonation';
import { useAdminConfirmation } from '@/hooks/useAdminConfirmation';

type UserDetailTab = 'activity' | 'sessions' | 'payments' | 'reports';

const TAB_CONFIG: { id: UserDetailTab; label: string; icon: any }[] = [
  { id: 'activity', label: 'Activité', icon: Activity },
  { id: 'sessions', label: 'Connexions', icon: LogIn },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'reports', label: 'Signalements', icon: AlertTriangle },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDU: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BLOQUÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  BUSINESS: 'Business',
  DEVELOPER: 'Développeur',
  ADMIN: 'Admin',
};

function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function useAdminUserActivity(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'activity'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}/activity`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function useAdminUserSessions(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'sessions'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}/sessions`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function useAdminUserPayments(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'payments'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}/payments`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function useAdminUserReports(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'reports'],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}/reports`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

function SessionIcon({ device }: { device?: string }) {
  const ua = (device || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <Monitor className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<UserDetailTab>('activity');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezeHours, setFreezeHours] = useState(24);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeBusy, setFreezeBusy] = useState(false);
  const { requestConfirmation, modal } = useAdminConfirmation();
  const { refetch } = useAdminUserDetail(id);

  const { data: user, isLoading: userLoading } = useAdminUserDetail(id);
  const { data: activityData, isLoading: activityLoading } = useAdminUserActivity(id);
  const { data: sessionsData, isLoading: sessionsLoading } = useAdminUserSessions(id);
  const { data: paymentsData, isLoading: paymentsLoading } = useAdminUserPayments(id);
  const { data: reportsData, isLoading: reportsLoading } = useAdminUserReports(id);

  const activities = Array.isArray(activityData) ? activityData : (activityData?.logs ?? []);
  const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.sessions ?? []);
  const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.payments ?? []);
  const reports = Array.isArray(reportsData) ? reportsData : (reportsData?.reports ?? []);

  const isFrozen = !!user?.frozenUntil && new Date(user.frozenUntil) > new Date();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFreeze = async () => {
    setFreezeBusy(true);
    try {
      const ok = await requestConfirmation({
        title: `Geler ${user?.email || 'ce compte'} ?`,
        description: `Le compte sera indisponible pendant ${freezeHours} heure(s)${
          freezeReason ? ` (motif : ${freezeReason})` : ''
        }. Cette action restreint l'accès — elle nécessite votre mot de passe.`,
        confirmLabel: 'Geler le compte',
        danger: true,
        action: async (creds) => {
          await apiClient.post(`/admin/users/${id}/freeze`, {
            durationHours: freezeHours,
            reason: freezeReason,
            ...creds,
          });
        },
      });
      if (ok) {
        showToast(`Utilisateur gelé ${freezeHours}h`);
        setFreezeOpen(false);
        setFreezeReason('');
        refetch();
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || 'Erreur gel', 'error');
    } finally {
      setFreezeBusy(false);
    }
  };

  const handleUnfreeze = async () => {
    setFreezeBusy(true);
    try {
      await apiClient.post(`/admin/users/${id}/unfreeze`, {});
      showToast('Utilisateur dégelé');
      refetch();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || 'Erreur dégel', 'error');
    } finally {
      setFreezeBusy(false);
    }
  };

  const [impBusy, setImpBusy] = useState(false);

  const handleImpersonate = async () => {
    setImpBusy(true);
    try {
      const res = await apiClient.post(`/admin/impersonate/${id}`, {});
      const { token, target } = res.data.data;
      startImpersonation(token, target);
      showToast(`Mode voir-comme activé : ${target.email}`);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 600);
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || e?.message || "Erreur d'impersonation",
        'error'
      );
    } finally {
      setImpBusy(false);
    }
  };

  if (userLoading) return <Loader className="min-h-[60vh]" />;

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="text-center py-20">
          <User className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Utilisateur introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Double validation (actions sensibles) */}
      {modal}

      {/* Toast */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl font-bold text-brand shrink-0">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {user.name || 'N/A'}
              </h2>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  STATUS_STYLES[user.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.status || 'N/A'}
              </span>
              {isFrozen && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                  <Snowflake className="h-3 w-3" />
                  Gelé jusqu'au {new Date(user.frozenUntil).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              {user.email || '-'}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(Array.isArray(user.roles) ? user.roles : []).map((role: string) => (
                <span
                  key={role}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {ROLE_LABELS[role] || role}
                </span>
              ))}
            </div>
            {isFrozen && user.freezeReason && (
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-2">
                Motif : {user.freezeReason}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleImpersonate}
              disabled={impBusy}
              title="Voir le dashboard comme cet utilisateur (lecture seule, 15 min)"
            >
              <Eye className="h-4 w-4" />
              Voir comme
            </Button>
            {isFrozen ? (
              <Button size="sm" variant="outline" onClick={handleUnfreeze} disabled={freezeBusy}>
                <Flame className="h-4 w-4" />
                Dégeler
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setFreezeOpen(true)} disabled={freezeBusy}>
                <Snowflake className="h-4 w-4" />
                Geler temporairement
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de gel */}
      {freezeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFreezeOpen(false)} />
          <Card className="relative w-full max-w-md z-10" padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-600">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Gel temporaire</h3>
                <p className="text-xs text-gray-500">
                  L'utilisateur ne pourra plus se connecter pendant la durée choisie.
                </p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durée (heures)
            </label>
            <select
              value={freezeHours}
              onChange={(e) => setFreezeHours(Number(e.target.value))}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              {[1, 6, 12, 24, 48, 72, 168].map((h) => (
                <option key={h} value={h}>
                  {h} heure{h > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motif
            </label>
            <textarea
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              placeholder="Ex : enquête en cours…"
              rows={3}
              className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFreezeOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleFreeze} disabled={freezeBusy}>
                <Snowflake className="h-4 w-4" />
                Geler
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TAB_CONFIG.map((tab) => {
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

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activityLoading ? (
            <Loader className="py-8" />
          ) : activities.length > 0 ? (
            activities.map((log: any) => (
              <Card key={log.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {log.action || 'Action inconnue'}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {log.details}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : ''}
                      {log.ip ? ` · ${log.ip}` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          {sessionsLoading ? (
            <Loader className="py-8" />
          ) : sessions.length > 0 ? (
            sessions.map((session: any) => (
              <Card key={session.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 shrink-0">
                    <SessionIcon device={session.device} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {session.device || 'Appareil inconnu'}
                      </p>
                      {session.isCurrent && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Actuelle
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session.location || 'Localisation inconnue'}
                      {session.ip ? ` · ${session.ip}` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Connecté:{' '}
                        {session.createdAt
                          ? new Date(session.createdAt).toLocaleString('fr-FR')
                          : '-'}
                      </span>
                      {session.lastActivity && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Dernière activité:{' '}
                          {new Date(session.lastActivity).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <LogIn className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune session active</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {paymentsLoading ? (
            <Loader className="py-8" />
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Montant</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="py-2.5 text-gray-900 dark:text-gray-100">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                        {p.amount ? `${Number(p.amount).toLocaleString()} FCFA` : '-'}
                      </td>
                      <td className="py-2.5">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {p.type || '-'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            p.status === 'COMPLETED' || p.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : p.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">{p.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <CreditCard className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun paiement</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reportsLoading ? (
            <Loader className="py-8" />
          ) : reports.length > 0 ? (
            reports.map((report: any) => (
              <Card key={report.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {report.title || 'Signalement'}
                      </p>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : report.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {report.description || report.reason || ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('fr-FR') : ''}
                      {report.reportedBy ? ` · Rapporté par: ${report.reportedBy}` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card padding="lg">
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun signalement</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
