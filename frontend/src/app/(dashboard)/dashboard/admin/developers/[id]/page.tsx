'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Code2,
  Shield,
  Package,
  DollarSign,
  Users,
  Ticket,
  ChevronLeft,
  FileText,
  BarChart3,
  BadgeCheck,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type DeveloperTab = 'modules' | 'revenues' | 'tickets' | 'documents';

const VERIF_STYLES: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDU: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BLOQUÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useAdminDeveloperDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'developers', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/developers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export default function AdminDeveloperDetailPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const id = params?.id as string;
  const isAdmin = user?.roles?.includes('ADMIN');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DeveloperTab>('modules');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: developer, isLoading } = useAdminDeveloperDetail(id);

  const statusMutation = useMutation({
    mutationFn: ({ action, reason }: { action: string; reason?: string }) =>
      apiClient.adminUpdateDeveloperStatus(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'developers', id] });
      setRejectOpen(false);
      setRejectReason('');
      setActionError('');
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    },
  });

  const handleReject = () => {
    if (rejectReason.trim().length < 5) {
      setActionError('Le motif doit contenir au moins 5 caractères');
      return;
    }
    statusMutation.mutate({ action: 'reject', reason: rejectReason.trim() });
  };

  const tabs = [
    { id: 'modules' as DeveloperTab, label: 'Modules', icon: Package },
    { id: 'revenues' as DeveloperTab, label: 'Revenus', icon: DollarSign },
    { id: 'tickets' as DeveloperTab, label: 'Tickets', icon: Ticket },
    { id: 'documents' as DeveloperTab, label: 'Documents', icon: FileText },
  ];

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  if (isLoading) {
    return <Loader className="py-20" size="xl" />;
  }

  if (!developer) {
    return (
      <EmptyState
        icon={<Code2 className="h-8 w-8" />}
        title="Développeur introuvable"
        description="Ce développeur n'existe pas ou a été supprimé."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
        <ChevronLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-3xl font-bold text-purple-600 shrink-0">
            {developer.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {developer.name || 'N/A'}
              </h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  STATUS_STYLES[developer.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {developer.status}
              </span>
              {developer.verificationStatus && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    VERIF_STYLES[developer.verificationStatus] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {developer.verificationStatus}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{developer.email}</p>
            {developer.bio && (
              <p className="text-sm text-gray-400 mt-2 max-w-2xl">{developer.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {/* KYC Verification Panel */}
      <Card padding="lg">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              {developer.verificationStatus === 'VERIFIED' ? (
                <BadgeCheck className="h-5 w-5 text-emerald-500" />
              ) : developer.verificationStatus === 'PENDING' ? (
                <Clock className="h-5 w-5 text-amber-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Vérification KYC
              </h2>
            </div>

            {developer.verificationStatus === 'PENDING' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dossier soumis — vérifiez les documents puis validez ou refusez avec un motif. Le
                développeur n&apos;a pas accès à son espace tant que le KYC n&apos;est pas validé.
              </p>
            )}
            {developer.verificationStatus === 'REJECTED' && (
              <div className="text-sm">
                <p className="text-red-600 dark:text-red-400 font-medium">Dossier refusé</p>
                {developer.rejectionReason && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Motif transmis : « {developer.rejectionReason} »
                  </p>
                )}
              </div>
            )}
            {developer.verificationStatus === 'VERIFIED' && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Identité vérifiée — le développeur a accès à son espace et peut publier des modules.
              </p>
            )}

            {/* Documents KYC */}
            <div className="mt-4 space-y-2">
              {[
                { label: "Pièce d'identité", url: developer.identityDocument },
                { label: 'Document entreprise', url: developer.companyDocument },
                { label: 'Photo du responsable', url: developer.responsiblePhoto },
              ]
                .filter((d) => !!d.url)
                .map((d) => (
                  <a
                    key={d.label}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {d.label}
                      </span>
                    </span>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-brand" />
                  </a>
                ))}
              {!developer.identityDocument && !developer.companyDocument && !developer.responsiblePhoto && (
                <p className="text-sm text-gray-400">Aucun document KYC soumis</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="lg:w-64 shrink-0 flex flex-col gap-2 lg:border-l lg:border-gray-200 dark:lg:border-gray-700 lg:pl-6">
            {actionError && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}
            {developer.verificationStatus !== 'VERIFIED' ? (
              <>
                <Button
                  variant="primary"
                  onClick={() => statusMutation.mutate({ action: 'verify' })}
                  disabled={statusMutation.isPending}
                >
                  <BadgeCheck className="h-4 w-4" />
                  Valider le KYC
                </Button>
                <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={statusMutation.isPending}>
                  <XCircle className="h-4 w-4" />
                  Refuser avec motif
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Compte validé le{' '}
                  {developer.verifiedAt
                    ? new Date(developer.verifiedAt).toLocaleDateString('fr-FR')
                    : '—'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectOpen(true)}
                  disabled={statusMutation.isPending}
                  title="Retirer la validation — un motif sera demandé au développeur"
                >
                  Retirer la validation
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reject reason modal */}
        {rejectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Refuser le dossier KYC
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Le développeur verra ce motif et devra corriger puis resoumettre ses documents.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setActionError('');
                }}
                rows={4}
                placeholder="Ex. : La photo de la pièce d'identité est illisible, merci de la resoumettre."
                className="mt-4 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              {actionError && <p className="text-xs text-red-500 mt-2">{actionError}</p>}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRejectOpen(false);
                    setRejectReason('');
                    setActionError('');
                  }}
                >
                  Annuler
                </Button>
                <Button variant="danger" size="sm" onClick={handleReject} disabled={statusMutation.isPending}>
                  Confirmer le refus
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Modules',
            value: developer.publishedModules ?? 0,
            icon: Package,
            color: 'text-blue-500',
          },
          {
            label: 'Revenus',
            value: developer.revenue ? `${Number(developer.revenue).toLocaleString()} FCFA` : '-',
            icon: DollarSign,
            color: 'text-emerald-500',
          },
          {
            label: 'Abonnés',
            value: developer.subscribersCount ?? 0,
            icon: Users,
            color: 'text-purple-500',
          },
          {
            label: 'Tickets',
            value: developer.ticketsCount ?? 0,
            icon: Ticket,
            color: 'text-amber-500',
          },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
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

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Modules ({developer.publishedModules ?? 0})
          </h3>
          {developer.modules?.length > 0 ? (
            <div className="space-y-2">
              {developer.modules.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      v{m.version || '1.0.0'} · {m.installations ?? 0} installations
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      m.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : m.status === 'PENDING_REVIEW'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : m.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun module publié</p>
          )}
        </Card>
      )}

      {/* Revenues Tab */}
      {activeTab === 'revenues' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Revenus totaux
            </h3>
            <p className="text-3xl font-bold text-emerald-600">
              {developer.revenue ? `${Number(developer.revenue).toLocaleString()} FCFA` : '-'}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Revenus par module
            </h3>
            {developer.moduleRevenues?.length > 0 ? (
              <div className="space-y-2">
                {developer.moduleRevenues.map((mr: any) => (
                  <div
                    key={mr.moduleId}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {mr.moduleName}
                    </span>
                    <span className="text-sm font-medium text-emerald-600">
                      {mr.amount ? `${Number(mr.amount).toLocaleString()} FCFA` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun revenu détaillé</p>
            )}
          </Card>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Tickets de support
          </h3>
          {developer.tickets?.length > 0 ? (
            <div className="space-y-2">
              {developer.tickets.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t.subject}
                    </p>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        t.status === 'OPEN'
                          ? 'bg-red-50 text-red-700'
                          : t.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t.priority} ·{' '}
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun ticket</p>
          )}
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Documents
          </h3>
          {developer.documents?.length > 0 ? (
            <div className="space-y-2">
              {developer.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {doc.type}
                      </p>
                      <p className="text-xs text-gray-400">{doc.name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      doc.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : doc.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun document</p>
          )}
        </Card>
      )}
    </div>
  );
}
