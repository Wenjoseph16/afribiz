'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Info,
  Lock,
  Bell,
  Palette,
  Globe,
  DollarSign,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Trash2,
  Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/features/hooks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';

const PREF_TABS = [
  { id: 'general', label: 'Général', icon: Info },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Préférences', icon: Palette },
  { id: 'security', label: 'Confidentialité', icon: Lock },
  { id: 'devices', label: 'Appareils', icon: Smartphone },
];

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { user } = useAuthStore();
  const [language, setLanguage] = useState('Français');
  const [currency, setCurrency] = useState('FCFA (XOF)');

  const { data: notifPrefs, isLoading: notifLoading } = useNotificationPreferences();
  const updateNotifPrefs = useUpdateNotificationPreferences();
  const { subscribed, subscribe, unsubscribe, isSupported } = usePushNotifications();

  const [prefs, setPrefs] = useState({
    darkMode: false,
    soundEnabled: true,
    confirmActions: true,
    showPrices: true,
    saveHistory: true,
    autoPlay: false,
  });

  const [sessions, setSessions] = useState<
    {
      id: string;
      device?: string;
      userAgent?: string;
      location?: string;
      city?: string;
      country?: string;
      lastActive?: string;
      isCurrent?: boolean;
    }[]
  >([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { notify } = useToast();

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apiClient.getSessions();
      const list = res.data.data?.sessions || res.data.data || [];
      setSessions(Array.isArray(list) ? list : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'devices') loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const disconnectSession = async (sessionId: string) => {
    setDisconnecting(sessionId);
    try {
      await apiClient.revokeSession(sessionId);
      notify({ title: 'Appareil déconnecté', variant: 'success' });
      loadSessions();
    } catch {
      notify({ title: 'Échec de la déconnexion', variant: 'error' });
    } finally {
      setDisconnecting(null);
    }
  };

  const disconnectAll = async () => {
    setDisconnecting('all');
    try {
      await apiClient.revokeOtherSessions();
      notify({ title: 'Autres appareils déconnectés', variant: 'success' });
      loadSessions();
    } catch {
      notify({ title: 'Échec de la déconnexion', variant: 'error' });
    } finally {
      setDisconnecting(null);
    }
  };

  const deviceLabel = (s: (typeof sessions)[number]) => {
    const ua = s.userAgent || s.device || '';
    if (/iPhone|iPad|Android/i.test(ua)) return 'Téléphone';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux/i.test(ua)) return 'Linux';
    return s.device || 'Appareil';
  };

  const deviceLocation = (s: (typeof sessions)[number]) => {
    const parts = [s.city, s.country].filter(Boolean).join(', ');
    return parts || s.location || 'Localisation inconnue';
  };

  const deviceTime = (s: (typeof sessions)[number]) => {
    if (s.isCurrent) return 'Actif maintenant';
    if (!s.lastActive) return 'Récemment';
    return `Actif il y a ${new Date(s.lastActive).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const isMobileUA = (s: (typeof sessions)[number]) =>
    /iPhone|iPad|Android/i.test(s.userAgent || '');

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const channels = [
    {
      label: "Dans l'application",
      desc: "Recevoir les notifications dans l'app",
      key: 'inApp' as const,
    },
    { label: 'Email', desc: 'Recevoir les notifications par email', key: 'email' as const },
    { label: 'SMS', desc: 'Recevoir les notifications par SMS', key: 'sms' as const },
    {
      label: 'Push',
      desc: subscribed ? 'Notifications push activées' : 'Notifications push sur votre appareil',
      key: 'push' as const,
    },
  ];

  const channelLookup: Record<string, string> = {
    inApp: 'IN_APP',
    email: 'EMAIL',
    sms: 'SMS',
    push: 'PUSH',
  };

  const channelEnabled = (key: string): boolean => {
    if (!notifPrefs) return ['IN_APP', 'EMAIL'].includes(channelLookup[key] ?? key);
    const prefs = Array.isArray(notifPrefs) ? notifPrefs : [];
    const pref = prefs.find(
      (p: { channel?: string; enabled?: boolean }) => p.channel === (channelLookup[key] ?? key)
    );
    return pref?.enabled ?? ['IN_APP', 'EMAIL'].includes(channelLookup[key] ?? key);
  };

  const toggleChannel = (key: string) => {
    const current = channelEnabled(key);
    const channel = channelLookup[key] ?? key;

    if (key === 'push') {
      if (!current && isSupported) {
        subscribe();
      } else if (current) {
        unsubscribe();
      }
    }

    const prefs: Array<{ channel: string; enabled: boolean }> = Array.isArray(notifPrefs)
      ? [...notifPrefs]
      : [];
    const existingIdx = prefs.findIndex((p) => p.channel === channel);
    if (existingIdx >= 0) {
      prefs[existingIdx] = { ...prefs[existingIdx], channel, enabled: !current };
    } else {
      prefs.push({ channel, enabled: !current });
    }
    updateNotifPrefs.mutate(prefs);
  };

  if (notifLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader
        title="Paramètres"
        description="Personnalisez votre expérience AfriBiz"
        breadcrumbs={[{ label: 'Paramètres' }]}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-48 shrink-0">
          <div className="space-y-1 sticky top-24">
            {PREF_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Général */}
          {activeTab === 'general' && (
            <>
              <Card title="Langue et Région">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[100px]">
                      Langue
                    </span>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      options={[
                        { value: 'Français', label: 'Français' },
                        { value: 'English', label: 'English' },
                        { value: 'Ewe', label: 'Ewe' },
                        { value: 'Yoruba', label: 'Yoruba' },
                      ]}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[100px]">
                      Devise
                    </span>
                    <Select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      options={[
                        { value: 'FCFA (XOF)', label: 'FCFA (XOF)' },
                        { value: 'EUR (€)', label: 'EUR (€)' },
                        { value: 'USD ($)', label: 'USD ($)' },
                        { value: 'GHS', label: 'GHS' },
                        { value: 'NGN', label: 'NGN' },
                      ]}
                      className="flex-1"
                    />
                  </div>
                </div>
              </Card>

              <Card title="Compte">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                      <p className="text-xs text-gray-500">{user?.email || 'Non défini'}</p>
                    </div>
                    <Link href="/dashboard/profile">
                      <Button variant="outline" size="xs">
                        Modifier
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Téléphone
                      </p>
                      <p className="text-xs text-gray-500">{user?.phone || 'Non défini'}</p>
                    </div>
                    <Link href="/dashboard/profile">
                      <Button variant="outline" size="xs">
                        Modifier
                      </Button>
                    </Link>
                  </div>
                  <div className="pt-2">
                    <Button variant="danger" size="sm" fullWidth>
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card title="Canaux de notification">
              <div className="space-y-3">
                {channels.map((ch) => {
                  const enabled = channelEnabled(ch.key);
                  return (
                    <div
                      key={ch.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {ch.label}
                        </p>
                        <p className="text-xs text-gray-500">{ch.desc}</p>
                      </div>
                      <Switch checked={enabled} onChange={() => toggleChannel(ch.key)} size="md" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Préférences */}
          {activeTab === 'preferences' && (
            <Card title="Préférences d'affichage">
              <div className="space-y-3">
                {[
                  {
                    key: 'darkMode',
                    label: 'Thème sombre',
                    desc: 'Utiliser le thème sombre par défaut',
                  },
                  {
                    key: 'soundEnabled',
                    label: 'Sons',
                    desc: 'Jouer un son lors des notifications',
                  },
                  {
                    key: 'confirmActions',
                    label: 'Confirmation',
                    desc: 'Demander confirmation avant les actions importantes',
                  },
                  {
                    key: 'showPrices',
                    label: 'Afficher les prix',
                    desc: 'Afficher les prix en FCFA dans la marketplace',
                  },
                  {
                    key: 'saveHistory',
                    label: 'Historique',
                    desc: "Conserver l'historique de navigation",
                  },
                  {
                    key: 'autoPlay',
                    label: 'Lecture automatique',
                    desc: 'Lire automatiquement les médias',
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <Switch
                      checked={prefs[key as keyof typeof prefs]}
                      onChange={() => togglePref(key as keyof typeof prefs)}
                      size="md"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Confidentialité */}
          {activeTab === 'security' && (
            <Card title="Confidentialité">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Données de navigation
                      </p>
                      <p className="text-xs text-gray-500">
                        Autoriser la collecte de données pour améliorer votre expérience
                      </p>
                    </div>
                  </div>
                  <Switch checked={true} onChange={() => {}} size="md" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Personnalisation
                      </p>
                      <p className="text-xs text-gray-500">
                        Recevoir des recommandations personnalisées basées sur votre activité
                      </p>
                    </div>
                  </div>
                  <Switch checked={true} onChange={() => {}} size="md" />
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Gestion des données
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Vous pouvez demander l&apos;export ou la suppression de vos données personnelles
                    à tout moment.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="xs">
                      Exporter mes données
                    </Button>
                    <Button variant="danger" size="xs">
                      Supprimer mes données
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Appareils */}
          {activeTab === 'devices' && (
            <Card title="Appareils connectés">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 animate-spin text-brand" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun appareil connecté</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400">
                          {isMobileUA(s) ? (
                            <Smartphone className="h-4 w-4" />
                          ) : (
                            <Laptop className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {deviceLabel(s)}
                            </span>
                            {s.isCurrent && (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Actuel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {deviceLocation(s)} · {deviceTime(s)}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => disconnectSession(s.id)}
                          disabled={disconnecting === s.id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {disconnecting === s.id ? 'Déconnexion...' : 'Déconnecter'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectAll}
                  disabled={disconnecting === 'all'}
                >
                  {disconnecting === 'all'
                    ? 'Déconnexion...'
                    : 'Déconnecter tous les autres appareils'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
