'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Globe,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/features/hooks';

const CHANNELS = [
  { id: 'in_app', label: 'In-app', icon: Bell, description: "Notifications dans l'application" },
  { id: 'email', label: 'Email', icon: Mail, description: 'Notifications par email' },
  { id: 'sms', label: 'SMS', icon: Smartphone, description: 'Notifications par SMS' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Notifications WhatsApp' },
];

const NOTIFICATION_TYPES = [
  {
    id: 'ORDER_PLACED',
    label: 'Nouvelles commandes',
    description: 'Quand un client passe commande',
  },
  {
    id: 'ORDER_STATUS',
    label: 'Statut commande',
    description: 'Changement de statut (confirmé, expédié, livré)',
  },
  {
    id: 'BOOKING_CONFIRMED',
    label: 'Réservations',
    description: 'Nouvelles réservations et rappels',
  },
  { id: 'NEW_MESSAGE', label: 'Messages', description: 'Nouveaux messages des clients' },
  { id: 'PAYMENT_RECEIVED', label: 'Paiements', description: 'Paiements reçus ou échoués' },
  { id: 'REVIEW_RESPONSE', label: 'Avis', description: 'Nouveaux avis et réponses' },
  { id: 'PROMOTION', label: 'Promotions', description: 'Campagnes promotionnelles' },
  { id: 'NEW_EVENT', label: 'Événements', description: 'Nouveaux événements et inscriptions' },
  { id: 'SYSTEM', label: 'Système', description: 'Alertes système et sécurité' },
  { id: 'DISPUTE_OPENED', label: 'Litiges', description: 'Litiges et réclamations' },
];

interface PreferenceEntry {
  type: string;
  channels: string[];
  [key: string]: unknown;
}

export default function NotificationPreferencesPage() {
  const qc = useQueryClient();
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState<PreferenceEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preferences) {
      // Preferences is either an array of { type, channels } or an object with entries
      const entries = Array.isArray(preferences)
        ? preferences
        : (preferences as any).entries || (preferences as any).preferences || [];
      setLocalPrefs(entries);
    }
  }, [preferences]);

  const getChannelsForType = (type: string): string[] => {
    const entry = localPrefs.find((p) => p.type === type);
    return entry?.channels || ['in_app'];
  };

  const toggleChannelForType = (type: string, channel: string) => {
    setSaved(false);
    setLocalPrefs((prev) => {
      const existing = prev.find((p) => p.type === type);
      if (existing) {
        const hasChannel = existing.channels.includes(channel);
        const updatedChannels = hasChannel
          ? existing.channels.filter((c) => c !== channel)
          : [...existing.channels, channel];
        // Don't allow disabling all channels if it's just one type being toggled
        return prev.map((p) =>
          p.type === type
            ? { ...p, channels: updatedChannels.length > 0 ? updatedChannels : ['in_app'] }
            : p
        );
      } else {
        return [...prev, { type, channels: ['in_app', channel] }];
      }
    });
  };

  const isChannelEnabled = (type: string, channel: string): boolean => {
    return getChannelsForType(type).includes(channel);
  };

  const handleSave = () => {
    updatePreferences.mutate(localPrefs, {
      onSuccess: () => {
        setSaved(true);
        qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
        setTimeout(() => setSaved(false), 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Erreur de chargement
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Impossible de charger les préférences
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Préférences de notifications"
        description="Personnalisez comment et quand vous recevez les notifications"
        gradient
        actions={
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSave}
            isLoading={updatePreferences.isPending}
          >
            {saved ? (
              <>✓ Enregistré</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Enregistrer
              </>
            )}
          </Button>
        }
      />

      {/* Canaux disponibles */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
          Canaux de notification
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Activez les canaux par type de notification ci-dessous
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
            >
              <ch.icon className="h-5 w-5 text-brand" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {ch.label}
              </span>
              <span className="text-[10px] text-gray-400 text-center">{ch.description}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tableau des préférences */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Types de notifications
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Activez ou désactivez chaque canal pour chaque type d&apos;événement
          </p>
        </div>

        {/* Header */}
        <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-2" />
          {CHANNELS.map((ch) => (
            <div key={ch.id} className="text-center">
              <ch.icon className="h-4 w-4 mx-auto text-brand" />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mt-0.5">
                {ch.label}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {NOTIFICATION_TYPES.map((nt) => (
            <div
              key={nt.id}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
            >
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{nt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{nt.description}</p>
              </div>
              {CHANNELS.map((ch) => (
                <div key={ch.id} className="flex items-center justify-center">
                  <button
                    onClick={() => toggleChannelForType(nt.id, ch.id)}
                    className={cn(
                      'w-10 h-6 rounded-full transition-all relative',
                      isChannelEnabled(nt.id, ch.id) ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                        isChannelEnabled(nt.id, ch.id) && 'translate-x-4'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <Globe className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Notifications intelligentes
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            Les rappels automatiques (commandes en attente, réservations, factures impayées) sont
            toujours envoyés quelle que soit la configuration ci-dessus. Vous recevrez des rappels à
            15min, 30min et 60min si aucune action n&apos;est effectuée.
          </p>
        </div>
      </div>
    </div>
  );
}
