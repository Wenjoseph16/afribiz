'use client';

import { useQuery } from '@tanstack/react-query';
import { Megaphone, Plus, Send, MessageCircle, Loader2, Target, Users, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';
import Link from 'next/link';

export default function MarketingPage() {
  const [filter, setFilter] = useState('all');
  const [sendTarget, setSendTarget] = useState<any | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      try {
        const res = await apiClient.getPromoCampaigns();
        return res.data.data || { campaigns: [] };
      } catch {
        return { campaigns: [] };
      }
    },
    retry: false,
  });

  const openSendModal = async (campaign: any) => {
    setSendTarget(campaign);
    setSendError('');
    setSelectedTemplate('');
    try {
      const res = await apiClient.getWhatsAppTemplates();
      const list = res.data?.data || [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch {
      setTemplates([]);
    }
  };

  const confirmSend = async () => {
    if (!sendTarget || !selectedTemplate) return;
    setSending(true);
    setSendError('');
    try {
      await apiClient.sendCampaignWhatsApp(sendTarget.id, { templateId: selectedTemplate });
      setSendTarget(null);
      setSending(false);
      refetch();
    } catch (e: any) {
      setSendError(e?.response?.data?.message || e?.message || 'Erreur lors de l envoi');
      setSending(false);
    }
  };

  if (error) {
    const status = (error as any)?.response?.status || (error as any)?.status;
    if (status === 403 || status === 404) {
      return (
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Marketing"
            description="Créez et gérez vos campagnes marketing"
            breadcrumbs={[{ label: 'Marketing' }]}
          />
          <div className="p-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Module Marketing non activé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Pour utiliser les campagnes marketing, vous devez d'abord activer le module Promotions
              depuis votre espace configuration.
            </p>
          </div>
        </div>
      );
    }
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );
  }
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const campaigns = Array.isArray(data) ? data : (data?.campaigns ?? []);
  // L'enum CampaignStatus est en MAJUSCULES (ACTIVE/SCHEDULED/COMPLETED/PAUSED/DRAFT)
  const statusFilterMap: Record<string, string> = {
    all: 'all',
    active: 'ACTIVE',
    scheduled: 'SCHEDULED',
    completed: 'COMPLETED',
    paused: 'PAUSED',
    draft: 'DRAFT',
  };
  const filtered =
    filter === 'all'
      ? campaigns
      : campaigns.filter((c: any) => c.status === statusFilterMap[filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Marketing"
        description="Créez et gérez vos campagnes marketing"
        breadcrumbs={[{ label: 'Marketing' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle campagne
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Megaphone className="h-5 w-5" />}
          label="Campagnes"
          value={campaigns.length}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Actives"
          value={campaigns.filter((c: any) => c.status === 'ACTIVE').length}
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          label="Planifiées"
          value={campaigns.filter((c: any) => c.status === 'SCHEDULED').length}
        />
        <StatsCard
          icon={<Eye className="h-5 w-5" />}
          label="Ouvertures totales"
          value={campaigns.reduce((s: number, c: any) => s + (c.openedCount || 0), 0)}
        />
      </div>

      <Card title="Campagnes" titleIcon={<Megaphone className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'active', label: 'Actives' },
            { key: 'scheduled', label: 'Planifiées' },
            { key: 'completed', label: 'Envoyées' },
            { key: 'paused', label: 'En pause' },
            { key: 'draft', label: 'Brouillons' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === s.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-10 w-10" />}
            title="Aucune campagne"
            description="Créez votre première campagne marketing"
            action={
              <Link href="/dashboard/marketing/new">
                <Button size="sm">Créer</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.channels?.length ? c.channels.join(', ') : 'WHATSAPP'} ·{' '}
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    {c.sentCount > 0 ? ` · ${c.sentCount} envoyés` : ''}
                    {c.openedCount > 0 ? ` · ${c.openedCount} ouverts` : ''}
                    {c.clickedCount > 0 ? ` · ${c.clickedCount} clics` : ''}
                    {c.sentCount > 0 && c.openedCount > 0
                      ? ` · ${Math.min(100, Math.round((c.openedCount / c.sentCount) * 100))}% ouverts`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      c.status === 'ACTIVE'
                        ? 'success'
                        : c.status === 'SCHEDULED'
                          ? 'warning'
                          : c.status === 'COMPLETED'
                            ? 'info'
                            : c.status === 'PAUSED'
                              ? 'default'
                              : 'info'
                    }
                  >
                    {c.status === 'COMPLETED'
                      ? 'Envoyée'
                      : c.status === 'SCHEDULED'
                        ? 'Planifiée'
                        : c.status === 'ACTIVE'
                          ? 'Active'
                          : c.status === 'PAUSED'
                            ? 'En pause'
                            : 'Brouillon'}
                  </Badge>
                  {c.status === 'DRAFT' && (
                    <Button size="sm" variant="secondary" onClick={() => openSendModal(c)}>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Envoyer WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!sendTarget}
        onClose={() => setSendTarget(null)}
        title={`Envoyer « ${sendTarget?.name || ''} » via WhatsApp`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez un template WhatsApp approuvé. Le message sera envoyé à tous vos clients
            ayant un téléphone, et créera une session WhatsApp pour chacun.
          </p>
          {templates.filter((t: any) => t.status === 'APPROVED').length === 0 ? (
            <div className="p-6 rounded-xl bg-gray-100 dark:bg-gray-800/50 text-center text-sm text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              Aucun template WhatsApp approuvé. Créez-en un depuis{' '}
              <Link href="/dashboard/whatsapp" className="text-brand-500 underline">
                WhatsApp Business
              </Link>{' '}
              et attendez qu'il soit APPROVED.
            </div>
          ) : (
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              options={templates
                .filter((t: any) => t.status === 'APPROVED')
                .map((t: any) => ({ value: t.id, label: `${t.name} (${t.category})` }))}
            />
          )}
          {sendError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {sendError}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={confirmSend}
            disabled={sending || !selectedTemplate}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Envoyer à tous les clients
              </>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
