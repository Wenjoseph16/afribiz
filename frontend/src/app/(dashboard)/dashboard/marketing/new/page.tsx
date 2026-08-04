'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Megaphone,
  Loader,
  Save,
  Send,
  Users,
  MessageCircle,
  CalendarClock,
  Type,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PUSH', label: 'Push' },
];

const AUDIENCES = [
  { value: 'ALL', label: 'Tous les clients' },
  { value: 'NEW_CLIENTS', label: 'Nouveaux clients' },
  { value: 'VIP', label: 'Clients VIP' },
  { value: 'LOYAL', label: 'Clients fidèles' },
  { value: 'INACTIVE', label: 'Clients inactifs' },
];

export default function NewMarketingCampaignPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState(false);

  const createCampaign = useMutation({
    mutationFn: async () =>
      apiClient.createPromoCampaign({
        name,
        description: description || undefined,
        channels: [channel],
        targetAudience,
        scheduledAt: scheduledAt || undefined,
        message: message || undefined,
      }),
    onSuccess: () => {
      setCreated(true);
      qc.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      setTimeout(() => router.push('/dashboard/marketing'), 1400);
    },
  });

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
          <Megaphone className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Campagne créée !
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirection vers vos campagnes marketing...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/marketing"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <PageHeader
          title="Nouvelle campagne"
          description="Lancez une campagne marketing vers vos clients"
          breadcrumbs={[
            { label: 'Marketing', href: '/dashboard/marketing' },
            { label: 'Nouvelle' },
          ]}
        />
      </div>

      <div className="max-w-2xl space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Type className="h-4 w-4 text-brand" /> Informations
          </h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nom de la campagne *</label>
            <Input
              placeholder="Ex: Promotion Ramadan, Solde de fin d'année..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Objectif de la campagne..."
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Send className="h-4 w-4 text-brand" /> Diffusion
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Canal
              </label>
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                options={CHANNELS}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <Users className="h-3 w-3" /> Audience
              </label>
              <Select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                options={AUDIENCES}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
              <CalendarClock className="h-3 w-3" /> Envoi programmé (optionnel)
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Bonjour {prenom}, profitez de -20% sur toute notre boutique cette semaine !"
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>
        </Card>

        <Button
          className="w-full"
          disabled={!name.trim() || createCampaign.isPending}
          onClick={() => createCampaign.mutate()}
        >
          {createCampaign.isPending ? (
            <Loader className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Créer la campagne
        </Button>
        {createCampaign.isError && (
          <p className="text-xs text-red-500 text-center">
            Erreur : {(createCampaign.error as any)?.message}
          </p>
        )}
      </div>
    </div>
  );
}
