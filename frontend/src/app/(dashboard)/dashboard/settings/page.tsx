'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Info, Lock, Bell, Palette, Globe, DollarSign,
  Eye, EyeOff, Smartphone, Trash2, Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/features/hooks';

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

  const [prefs, setPrefs] = useState({
    darkMode: false,
    soundEnabled: true,
    confirmActions: true,
    showPrices: true,
    saveHistory: true,
    autoPlay: false,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const channels = [
    { label: "Dans l'application", desc: 'Recevoir les notifications dans l\'app', key: 'inApp' as const },
    { label: 'Email', desc: 'Recevoir les notifications par email', key: 'email' as const },
    { label: 'SMS', desc: 'Recevoir les notifications par SMS', key: 'sms' as const },
    { label: 'Push', desc: 'Notifications push sur votre appareil', key: 'push' as const },
  ];

  const channelEnabled = (key: string): boolean => {
    if (!notifPrefs) return ['inApp', 'email'].includes(key);
    const pref = Array.isArray(notifPrefs) ? notifPrefs.find((p: any) => p.channel === key) : notifPrefs[key];
    return pref?.enabled ?? ['inApp', 'email'].includes(key);
  };

  const toggleChannel = (key: string) => {
    const current = channelEnabled(key);
    const newPrefs = (Array.isArray(notifPrefs) ? notifPrefs : []).filter((p: any) => p.id || p.channel);
    const existingIdx = newPrefs.findIndex((p: any) => p.channel === key);
    if (existingIdx >= 0) {
      newPrefs[existingIdx] = { ...newPrefs[existingIdx], channel: key, enabled: !current };
    } else {
      newPrefs.push({ channel: key, enabled: !current });
    }
    updateNotifPrefs.mutate(newPrefs);
  };

  if (notifLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

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
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[100px]">Langue</span>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                      <option>Français</option><option>English</option><option>Ewe</option><option>Yoruba</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[100px]">Devise</span>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                      <option>FCFA (XOF)</option><option>EUR (€)</option><option>USD ($)</option><option>GHS</option><option>NGN</option>
                    </select>
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
                    <Link href="/dashboard/profile"><Button variant="outline" size="xs">Modifier</Button></Link>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Téléphone</p>
                      <p className="text-xs text-gray-500">{user?.phone || 'Non défini'}</p>
                    </div>
                    <Link href="/dashboard/profile"><Button variant="outline" size="xs">Modifier</Button></Link>
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
                    <div key={ch.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ch.label}</p>
                        <p className="text-xs text-gray-500">{ch.desc}</p>
                      </div>
                      <div onClick={() => toggleChannel(ch.key)} className={cn('w-10 h-6 rounded-full transition-colors relative cursor-pointer', enabled ? 'bg-emerald-700' : 'bg-gray-200')}>
                        <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm', enabled ? 'left-5' : 'left-1')} />
                      </div>
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
                  { key: 'darkMode', label: 'Thème sombre', desc: 'Utiliser le thème sombre par défaut' },
                  { key: 'soundEnabled', label: 'Sons', desc: 'Jouer un son lors des notifications' },
                  { key: 'confirmActions', label: 'Confirmation', desc: 'Demander confirmation avant les actions importantes' },
                  { key: 'showPrices', label: 'Afficher les prix', desc: 'Afficher les prix en FCFA dans la marketplace' },
                  { key: 'saveHistory', label: 'Historique', desc: 'Conserver l\'historique de navigation' },
                  { key: 'autoPlay', label: 'Lecture automatique', desc: 'Lire automatiquement les médias' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <div onClick={() => togglePref(key as keyof typeof prefs)} className={cn('w-10 h-6 rounded-full transition-colors relative cursor-pointer', prefs[key as keyof typeof prefs] ? 'bg-emerald-700' : 'bg-gray-200')}>
                      <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm', prefs[key as keyof typeof prefs] ? 'left-5' : 'left-1')} />
                    </div>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Données de navigation</p>
                      <p className="text-xs text-gray-500">Autoriser la collecte de données pour améliorer votre expérience</p>
                    </div>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-emerald-700 relative cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-5 shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <EyeOff className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Personnalisation</p>
                      <p className="text-xs text-gray-500">Recevoir des recommandations personnalisées basées sur votre activité</p>
                    </div>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-emerald-700 relative cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-white absolute top-1 left-5 shadow-sm" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Gestion des données</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Vous pouvez demander l&apos;export ou la suppression de vos données personnelles à tout moment.</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="xs">Exporter mes données</Button>
                    <Button variant="danger" size="xs">Supprimer mes données</Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Appareils */}
          {activeTab === 'devices' && (
            <Card title="Appareils connectés">
              <div className="space-y-3">
                {[
                  { name: 'iPhone 15 Pro', location: 'Lomé, Togo', time: 'Actif maintenant', isCurrent: true },
                  { name: 'MacBook Pro', location: 'Lomé, Togo', time: 'Il y a 2h', isCurrent: false },
                  { name: 'Samsung Galaxy S24', location: 'Accra, Ghana', time: 'Il y a 3j', isCurrent: false },
                  { name: 'Windows PC - Chrome', location: 'Cotonou, Bénin', time: 'Il y a 1sem', isCurrent: false },
                ].map((device, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400"><Smartphone className="h-4 w-4" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{device.name}</span>
                          {device.isCurrent && <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Actuel</span>}
                        </div>
                        <p className="text-xs text-gray-500">{device.location} · {device.time}</p>
                      </div>
                    </div>
                    {!device.isCurrent && (
                      <button className="text-xs text-red-600 hover:text-red-700 font-medium">Déconnecter</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm">Déconnecter tous les appareils</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
