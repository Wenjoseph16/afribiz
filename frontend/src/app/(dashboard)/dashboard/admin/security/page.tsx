'use client';

import { useState } from 'react';
import {
  Shield, Users, Monitor, AlertTriangle, Ban, FileText,
  ChevronLeft, ChevronRight, EyeOff, Trash2, Unlock, Lock,
  CheckCircle, XCircle, Search,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type SecurityTab = 'admins' | 'sessions' | 'attempts' | 'blacklist' | 'journal';

const TABS: { id: SecurityTab; label: string; icon: any }[] = [
  { id: 'admins', label: 'Administrateurs', icon: Users },
  { id: 'sessions', label: 'Sessions actives', icon: Monitor },
  { id: 'attempts', label: 'Tentatives suspectes', icon: AlertTriangle },
  { id: 'blacklist', label: 'Liste noire IP', icon: Ban },
  { id: 'journal', label: 'Journal sécurité', icon: FileText },
];

export default function AdminSecurityPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [activeTab, setActiveTab] = useState<SecurityTab>('admins');
  const [page, setPage] = useState(1);
  const limit = 15;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'security', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/stats');
      return res.data.data || {};
    },
    enabled: isAdmin,
  });

  const { data: adminsData, isLoading: loadingAdmins } = useQuery({
    queryKey: ['admin', 'security', 'admins', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/admins', { params: { page, limit } });
      return res.data.data || { admins: [], totalPages: 1 };
    },
    enabled: isAdmin && activeTab === 'admins',
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['admin', 'security', 'sessions', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/sessions', { params: { page, limit } });
      return res.data.data || { sessions: [], totalPages: 1 };
    },
    enabled: isAdmin && activeTab === 'sessions',
  });

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['admin', 'security', 'attempts', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/attempts', { params: { page, limit } });
      return res.data.data || { attempts: [], totalPages: 1 };
    },
    enabled: isAdmin && activeTab === 'attempts',
  });

  const { data: blacklistData, isLoading: loadingBlacklist } = useQuery({
    queryKey: ['admin', 'security', 'blacklist', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/blacklist', { params: { page, limit } });
      return res.data.data || { ips: [], totalPages: 1 };
    },
    enabled: isAdmin && activeTab === 'blacklist',
  });

  const { data: journalData, isLoading: loadingJournal } = useQuery({
    queryKey: ['admin', 'security', 'journal', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/security/journal', { params: { page, limit } });
      return res.data.data || { entries: [], totalPages: 1 };
    },
    enabled: isAdmin && activeTab === 'journal',
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/admin/security/sessions/${sessionId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'security', 'sessions'] }); setToast({ message: 'Session révoquée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la révocation', type: 'error' }); },
  });

  const blockIpMutation = useMutation({
    mutationFn: (ip: string) => apiClient.post(`/admin/security/blacklist`, { ip }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'security', 'attempts'] }); qc.invalidateQueries({ queryKey: ['admin', 'security', 'blacklist'] }); setToast({ message: 'IP bloquée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors du blocage', type: 'error' }); },
  });

  const unblockIpMutation = useMutation({
    mutationFn: (ip: string) => apiClient.delete(`/admin/security/blacklist/${ip}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'security', 'blacklist'] }); setToast({ message: 'IP débloquée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors du déblocage', type: 'error' }); },
  });

  const admins = Array.isArray(adminsData) ? adminsData : adminsData?.admins ?? [];
  const sessions = Array.isArray(sessionsData) ? sessionsData : sessionsData?.sessions ?? [];
  const attempts = Array.isArray(attemptsData) ? attemptsData : attemptsData?.attempts ?? [];
  const ips = Array.isArray(blacklistData) ? blacklistData : blacklistData?.ips ?? [];
  const journal = Array.isArray(journalData) ? journalData : journalData?.entries ?? [];

  const totalPages = adminsData?.totalPages ?? sessionsData?.totalPages ?? attemptsData?.totalPages ?? blacklistData?.totalPages ?? journalData?.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Sécurité</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto font-bold">&times;</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Centre de sécurité</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des accès et de la sécurité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.adminCount ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Administrateurs</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.activeSessions ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions actives</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold text-amber-600">{stats?.suspiciousAttempts ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Tentatives suspectes</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold text-red-600">{stats?.blockedIps ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">IP bloquées</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Admins */}
      {activeTab === 'admins' && (
        <Card padding="none">
          {loadingAdmins ? <Loader className="py-20" /> : admins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Rôle</th>
                    <th className="p-4 font-medium">Permissions</th>
                    <th className="p-4 font-medium">Dernière connexion</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a: any) => (
                    <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{a.name || '-'}</td>
                      <td className="p-4 text-gray-500">{a.email || '-'}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand">{a.role || '-'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {(a.permissions || []).map((p: string) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{p}</span>
                          ))}
                          {(!a.permissions || a.permissions.length === 0) && <span className="text-xs text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-500">{a.lastLogin ? new Date(a.lastLogin).toLocaleString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<Users className="h-8 w-8" />} title="Aucun administrateur" description="Aucun administrateur trouvé." />}
        </Card>
      )}

      {/* Sessions */}
      {activeTab === 'sessions' && (
        <Card padding="none">
          {loadingSessions ? <Loader className="py-20" /> : sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">Utilisateur</th>
                    <th className="p-4 font-medium">IP</th>
                    <th className="p-4 font-medium">Appareil</th>
                    <th className="p-4 font-medium">Dernière activité</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{s.user?.name || s.userId || '-'}</td>
                      <td className="p-4 text-gray-500 text-xs">{s.ip || '-'}</td>
                      <td className="p-4 text-gray-500 text-xs">{s.device || s.userAgent?.slice(0, 40) || '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{s.lastActivity ? new Date(s.lastActivity).toLocaleString('fr-FR') : '-'}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="xs" onClick={() => revokeSessionMutation.mutate(s.id)}>
                          <EyeOff className="h-3.5 w-3.5 text-red-500" /> Révoquer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<Monitor className="h-8 w-8" />} title="Aucune session active" description="Aucune session active trouvée." />}
        </Card>
      )}

      {/* Attempts */}
      {activeTab === 'attempts' && (
        <Card padding="none">
          {loadingAttempts ? <Loader className="py-20" /> : attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">IP</th>
                    <th className="p-4 font-medium">Tentatives</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((att: any) => (
                    <tr key={att.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 text-xs text-gray-900 dark:text-gray-100">{att.date ? new Date(att.date).toLocaleString('fr-FR') : '-'}</td>
                      <td className="p-4 text-gray-500">{att.email || '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{att.ip || '-'}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600">{att.count || 0}</span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="xs" onClick={() => blockIpMutation.mutate(att.ip)}>
                          <Ban className="h-3.5 w-3.5 text-red-500" /> Bloquer IP
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="Aucune tentative" description="Aucune tentative suspecte détectée." />}
        </Card>
      )}

      {/* Blacklist */}
      {activeTab === 'blacklist' && (
        <Card padding="none">
          {loadingBlacklist ? <Loader className="py-20" /> : ips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">IP</th>
                    <th className="p-4 font-medium">Raison</th>
                    <th className="p-4 font-medium">Date de blocage</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ips.map((ip: any) => (
                    <tr key={ip.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 font-mono text-sm text-gray-900 dark:text-gray-100">{ip.ip || '-'}</td>
                      <td className="p-4 text-gray-500">{ip.reason || '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{ip.blockedAt ? new Date(ip.blockedAt).toLocaleString('fr-FR') : '-'}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="xs" onClick={() => unblockIpMutation.mutate(ip.ip)}>
                          <Unlock className="h-3.5 w-3.5 text-emerald-500" /> Débloquer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<Ban className="h-8 w-8" />} title="Aucune IP bloquée" description="La liste noire est vide." />}
        </Card>
      )}

      {/* Journal */}
      {activeTab === 'journal' && (
        <Card padding="none">
          {loadingJournal ? <Loader className="py-20" /> : journal.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Action</th>
                    <th className="p-4 font-medium">Utilisateur</th>
                    <th className="p-4 font-medium">IP</th>
                    <th className="p-4 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((entry: any) => (
                    <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4 text-xs text-gray-900 dark:text-gray-100">{entry.date ? new Date(entry.date).toLocaleString('fr-FR') : '-'}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">{entry.action || '-'}</span>
                      </td>
                      <td className="p-4 text-gray-500">{entry.user?.name || entry.userId || '-'}</td>
                      <td className="p-4 text-xs text-gray-500">{entry.ip || '-'}</td>
                      <td className="p-4">
                        <span className={`text-xs font-medium ${
                          entry.status === 'SUCCESS' ? 'text-emerald-600' : entry.status === 'WARNING' ? 'text-amber-600' : 'text-red-600'
                        }`}>{entry.status || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState icon={<FileText className="h-8 w-8" />} title="Aucune entrée" description="Le journal de sécurité est vide." />}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
