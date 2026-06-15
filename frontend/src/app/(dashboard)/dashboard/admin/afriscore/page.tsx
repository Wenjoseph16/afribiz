'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  Trophy, Star, Award, RefreshCw, ScrollText,
  History, ShieldAlert, Edit3, Save, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

type AfriScoreTab = 'rules' | 'badges' | 'history' | 'audit';

const scoringComponents = [
  { key: 'commercialActivity', label: 'Activité commerciale', defaultWeight: 200 },
  { key: 'financialBehavior', label: 'Comportement financier', defaultWeight: 200 },
  { key: 'satisfaction', label: 'Satisfaction client', defaultWeight: 200 },
  { key: 'operationalReliability', label: 'Fiabilité opérationnelle', defaultWeight: 200 },
  { key: 'profileCompleteness', label: 'Complétude du profil', defaultWeight: 200 },
];

export default function AdminAfriScorePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AfriScoreTab>('rules');
  const [page, setPage] = useState(1);
  const [badgePage, setBadgePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [editingWeights, setEditingWeights] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const limit = 10;

  const isAdmin = user?.roles?.includes('ADMIN');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'afriscore', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/afriscore/stats');
      return res.data.data;
    },
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['admin', 'afriscore', 'rules'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/afriscore/rules');
      return res.data.data;
    },
  });

  const { data: badgesData, isLoading: badgesLoading } = useQuery({
    queryKey: ['admin', 'afriscore', 'badges', badgePage],
    queryFn: async () => {
      const res = await apiClient.get('/admin/afriscore/badges', { params: { page: badgePage, limit } });
      return res.data.data;
    },
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'afriscore', 'history', historyPage],
    queryFn: async () => {
      const res = await apiClient.get('/admin/afriscore/history', { params: { page: historyPage, limit } });
      return res.data.data;
    },
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin', 'afriscore', 'audit', auditPage],
    queryFn: async () => {
      const res = await apiClient.get('/admin/afriscore/audit', { params: { page: auditPage, limit } });
      return res.data.data;
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: () => apiClient.adminRecomputeAllScores(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'afriscore', 'stats'] });
    },
  });

  const saveWeightsMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/admin/afriscore/rules', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'afriscore', 'rules'] });
      setEditingWeights(false);
    },
  });

  const rules = Array.isArray(rulesData) ? rulesData : rulesData?.rules ?? [];
  const badges = Array.isArray(badgesData) ? badgesData : badgesData?.badges ?? badgesData?.data ?? [];
  const totalBadges = badgesData?.total ?? badgesData?.count ?? badges.length;
  const totalBadgePages = Math.ceil(totalBadges / limit) || 1;

  const history = Array.isArray(historyData) ? historyData : historyData?.history ?? historyData?.data ?? [];
  const totalHistory = historyData?.total ?? historyData?.count ?? history.length;
  const totalHistoryPages = Math.ceil(totalHistory / limit) || 1;

  const audit = Array.isArray(auditData) ? auditData : auditData?.audit ?? auditData?.data ?? [];
  const totalAudit = auditData?.total ?? auditData?.count ?? audit.length;
  const totalAuditPages = Math.ceil(totalAudit / limit) || 1;

  const tabs = [
    { id: 'rules' as AfriScoreTab, label: 'Règles de notation', icon: ScrollText },
    { id: 'badges' as AfriScoreTab, label: 'Badges', icon: Award },
    { id: 'history' as AfriScoreTab, label: 'Historique', icon: History },
    { id: 'audit' as AfriScoreTab, label: 'Audit', icon: ShieldAlert },
  ];

  const startEditing = () => {
    const current: Record<string, number> = {};
    (rules.length > 0 ? rules : scoringComponents).forEach((r: any) => {
      current[r.key || r.name] = r.weight ?? r.defaultWeight ?? 200;
    });
    setWeights(current);
    setEditingWeights(true);
  };

  const handleSaveWeights = () => {
    saveWeightsMutation.mutate({ weights });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration AfriScore
        </h1>
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Administration AfriScore
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez le système de notation, les badges et l&apos;audit
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => recomputeMutation.mutate()}
          isLoading={recomputeMutation.isPending}
        >
          <RefreshCw className="h-4 w-4" />
          Recalculer tous les scores
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : (stats?.scoresCalculated ?? stats?.total ?? '-')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scores calculés</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : (stats?.averageScore ?? stats?.avg ?? '-')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Score moyen</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : (stats?.badgesAwarded ?? stats?.totalBadges ?? '-')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Badges attribués</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statsLoading ? '-' : (stats?.recomputations ?? stats?.totalRecomputations ?? '-')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recalculs</p>
            </div>
          </div>
        </Card>
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

      {/* Règles de notation */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pondération des composantes du score (total: 1000)
            </p>
            <div className="flex items-center gap-2">
              {editingWeights ? (
                <>
                  <Button variant="ghost" size="xs" onClick={() => setEditingWeights(false)}>
                    <X className="h-3.5 w-3.5" />
                    Annuler
                  </Button>
                  <Button variant="primary" size="xs" onClick={handleSaveWeights} isLoading={saveWeightsMutation.isPending}>
                    <Save className="h-3.5 w-3.5" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="xs" onClick={startEditing}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Modifier les poids
                </Button>
              )}
            </div>
          </div>

          {rulesLoading ? (
            <Loader className="py-8" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(rules.length > 0 ? rules : scoringComponents).map((component: any) => {
                const key = component.key || component.name;
                return (
                  <Card key={key}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {component.label}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand">
                        {editingWeights ? weights[key] ?? component.defaultWeight ?? component.weight : component.weight ?? component.defaultWeight} pts
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {component.description || `Score basé sur la ${component.label.toLowerCase()}`}
                    </p>
                    {editingWeights && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={weights[key] ?? component.defaultWeight ?? component.weight ?? 0}
                          onChange={(e) => setWeights((prev) => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                        />
                      </div>
                    )}
                    {!editingWeights && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-brand transition-all"
                          style={{ width: `${((component.weight ?? component.defaultWeight ?? 200) / 1000) * 100}%` }}
                        />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          {badgesLoading ? (
            <Loader className="py-8" />
          ) : badges.length === 0 ? (
            <EmptyState
              icon={<Award className="h-8 w-8" />}
              title="Aucun badge"
              description="Aucun badge configuré pour le moment."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge: any) => (
                <Card key={badge.id}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{badge.icon || '🏆'}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{badge.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description || '-'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          Seuil: {badge.threshold ?? badge.minScore ?? '-'}
                        </span>
                        {badge.category && (
                          <span className="text-[10px] text-gray-400">{badge.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {totalBadgePages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {badgePage} sur {totalBadgePages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={badgePage <= 1} onClick={() => setBadgePage((p) => Math.max(1, p - 1))}>
                  Précédent
                </Button>
                <Button variant="secondary" size="sm" disabled={badgePage >= totalBadgePages} onClick={() => setBadgePage((p) => p + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyLoading ? (
            <Loader className="py-8" />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title="Aucun historique"
              description="Aucun changement de score enregistré."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Business</th>
                    <th className="p-3 font-medium">Ancien score</th>
                    <th className="p-3 font-medium">Nouveau score</th>
                    <th className="p-3 font-medium">Variation</th>
                    <th className="p-3 font-medium">Raison</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry: any) => {
                    const diff = (entry.newScore ?? entry.new_value ?? 0) - (entry.oldScore ?? entry.old_value ?? 0);
                    return (
                      <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                          {entry.business?.name || entry.businessId?.slice(0, 12) || '-'}
                        </td>
                        <td className="p-3">{entry.oldScore ?? entry.old_value ?? '-'}</td>
                        <td className="p-3">{entry.newScore ?? entry.new_value ?? '-'}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400">{entry.reason || entry.changedBy || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {historyPage} sur {totalHistoryPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}>
                  Précédent
                </Button>
                <Button variant="secondary" size="sm" disabled={historyPage >= totalHistoryPages} onClick={() => setHistoryPage((p) => p + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {auditLoading ? (
            <Loader className="py-8" />
          ) : audit.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-8 w-8" />}
              title="Aucun audit"
              description="Aucune entrée d'audit disponible."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Utilisateur</th>
                    <th className="p-3 font-medium">Cible</th>
                    <th className="p-3 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((entry: any) => (
                    <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 text-gray-900 dark:text-gray-100">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {entry.action}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {entry.user?.name || entry.user?.email || entry.userId?.slice(0, 8) || '-'}
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400">{entry.target || entry.businessId?.slice(0, 8) || '-'}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{entry.details || entry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalAuditPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {auditPage} sur {totalAuditPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>
                  Précédent
                </Button>
                <Button variant="secondary" size="sm" disabled={auditPage >= totalAuditPages} onClick={() => setAuditPage((p) => p + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
