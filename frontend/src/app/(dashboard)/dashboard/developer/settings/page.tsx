'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Globe, Trash2, AlertTriangle, Save } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useUpdateDeveloperProfile } from '@/features/developerHooks';

const NOTIF_CATEGORIES = [
  { id: 'install', label: 'Nouvelle installation', desc: 'Un business installe votre module' },
  { id: 'review', label: 'Nouvel avis', desc: 'Un client laisse un avis' },
  { id: 'ticket', label: 'Nouveau ticket', desc: 'Un client ouvre un ticket' },
  { id: 'payment', label: 'Paiement reçu', desc: 'Un abonnement ou achat est validé' },
  { id: 'update', label: 'Mise à jour publiée', desc: 'Votre version est en ligne' },
  { id: 'uninstall', label: 'Désinstallation', desc: 'Un business retire votre module' },
];

export default function DeveloperSettingsPage() {
  const qc = useQueryClient();
  const [notifState, setNotifState] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Africa/Abidjan');
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    data: prefs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['developer-notification-preferences'],
    queryFn: async () => {
      const res = await apiClient.getNotificationPreferences();
      return res.data.data || [];
    },
  });

  const updateProfile = useUpdateDeveloperProfile();
  const updateNotifPrefs = useMutation({
    mutationFn: (preferences: any[]) => apiClient.updateNotificationPreferences(preferences),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['developer-notification-preferences'] }),
  });

  useEffect(() => {
    if (prefs && Array.isArray(prefs)) {
      const state: Record<string, boolean> = {};
      prefs.forEach((p: any) => {
        state[p.category || p.id] = p.enabled ?? true;
      });
      NOTIF_CATEGORIES.forEach((c) => {
        if (state[c.id] === undefined) state[c.id] = true;
      });
      setNotifState(state);
    } else {
      const defaults: Record<string, boolean> = {};
      NOTIF_CATEGORIES.forEach((c) => {
        defaults[c.id] = true;
      });
      setNotifState(defaults);
    }
  }, [prefs]);

  const toggleNotif = (id: string) => setNotifState((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    setSaveMessage(null);
    try {
      const notifPayload = Object.entries(notifState).map(([category, enabled]) => ({
        category,
        enabled,
        channel: 'IN_APP',
      }));
      await updateNotifPrefs.mutateAsync(notifPayload as any);
      await updateProfile.mutateAsync({ language, timezone });
      setSaveMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Paramètres"
        description="Gérez vos préférences et notifications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Paramètres' },
        ]}
        actions={
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSave}
            isLoading={updateProfile.isPending || updateNotifPrefs.isPending}
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </Button>
        }
      />

      {saveMessage && (
        <div
          className={cn(
            'p-3 rounded-xl text-sm font-medium',
            saveMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {saveMessage.text}
        </div>
      )}

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
            <Bell className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Préférences de notification
          </h3>
        </div>
        <div className="space-y-2">
          {NOTIF_CATEGORIES.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{n.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
              </div>
              <button
                onClick={() => toggleNotif(n.id)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                  notifState[n.id] ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                    notifState[n.id] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Langue et région
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Langue
            </label>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English' },
                { value: 'pt', label: 'Português' },
                { value: 'ar', label: 'العربية' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Fuseau horaire
            </label>
            <Select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[
                { value: 'Africa/Abidjan', label: 'Afrique/Abidjan (UTC+0)' },
                { value: 'Africa/Lagos', label: 'Afrique/Lagos (UTC+1)' },
                { value: 'Africa/Nairobi', label: 'Afrique/Nairobi (UTC+3)' },
                { value: 'Africa/Johannesburg', label: 'Afrique/Johannesburg (UTC+2)' },
                { value: 'Africa/Cairo', label: 'Afrique/Caire (UTC+2)' },
                { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="border-red-200 dark:border-red-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Zone dangereuse
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Actions irréversibles</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Supprimer le compte développeur
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Cette action est irréversible. Tous vos modules, revenus et données seront
                définitivement supprimés.
              </p>
              <Button variant="danger" size="sm" className="mt-3">
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
