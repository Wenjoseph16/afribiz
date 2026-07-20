'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Smartphone,
  Laptop,
  Globe,
  AlertTriangle,
  Key,
  LogOut,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

export default function SecurityPage() {
  const qc = useQueryClient();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['developer-sessions'],
    queryFn: async () => {
      const res = await apiClient.getSessions();
      return res.data.data || [];
    },
  });

  const sessList = Array.isArray(sessions) ? sessions : [];

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.revokeSession(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['developer-sessions'] }),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => apiClient.revokeOtherSessions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['developer-sessions'] }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => apiClient.updatePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordError('');
    },
    onError: (err: any) => {
      setPasswordError(err?.response?.data?.error || 'Erreur lors du changement de mot de passe');
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    changePasswordMutation.mutate();
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sécurité"
        description="Paramètres de sécurité de votre compte développeur"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Sécurité' },
        ]}
      />

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mot de passe</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Modifiez votre mot de passe régulièrement
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
          Changer le mot de passe
        </Button>
      </Card>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card padding="lg" className="w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Changer le mot de passe
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20"
                />
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              <div className="flex items-center gap-3 justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={changePasswordMutation.isPending}
                >
                  Confirmer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Sessions actives
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Appareils connectés à votre compte
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500"
            onClick={() => revokeOthersMutation.mutate()}
            isLoading={revokeOthersMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            Tout déconnecter
          </Button>
        </div>
        <div className="space-y-3">
          {sessList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune session active</p>
          ) : (
            sessList.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  {s.deviceType === 'mobile' ? (
                    <Smartphone className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Laptop className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.device || s.userAgent || 'Appareil inconnu'}
                    </p>
                    {s.isCurrent && (
                      <Badge variant="success" size="xs">
                        Actuelle
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    IP {s.ip} · {s.location || 'Localisation inconnue'} ·{' '}
                    {s.lastActive
                      ? new Date(s.lastActive).toLocaleString('fr-FR')
                      : 'Actif maintenant'}
                  </p>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-red-400 hover:text-red-600"
                    onClick={() => revokeMutation.mutate(s.id)}
                    isLoading={revokeMutation.isPending}
                  >
                    Déconnecter
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Journal de connexion
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Historique des connexions récentes
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                  Appareil
                </th>
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                  IP
                </th>
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">
                  Dernière activité
                </th>
              </tr>
            </thead>
            <tbody>
              {sessList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-gray-400">
                    Aucune donnée disponible
                  </td>
                </tr>
              ) : (
                sessList.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                      {s.device || s.userAgent || 'Inconnu'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {s.ip || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                      {s.lastActive ? new Date(s.lastActive).toLocaleString('fr-FR') : 'En cours'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
