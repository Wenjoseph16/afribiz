'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Building2, Package, Download, Search, Users, Filter,
  CheckCircle, Clock, Eye, MapPin, Globe, Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperInstallations } from '@/features/developerHooks';
import type { DeveloperModuleInstallation } from '@/types/developer';

const STATUS_TABS = [
  { id: undefined, label: 'Tous' },
  { id: 'ACTIVE', label: 'Actifs' },
  { id: 'DISABLED', label: 'Désactivés' },
  { id: 'UNINSTALLED', label: 'Désinstallés' },
] as const;

export default function DeveloperClientsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: installationsData, isLoading, error, refetch } = useDeveloperInstallations();

  const installations = useMemo(() => {
    if (!installationsData) return [];
    return Array.isArray(installationsData) ? installationsData : (installationsData.installations || installationsData.data || []);
  }, [installationsData]);

  const clients = useMemo(() => {
    const clientMap = new Map<string, {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
      country?: string;
      city?: string;
      modules: string[];
      installDate: string;
      lastActive: string;
      status: string;
    }>();

    (installations as DeveloperModuleInstallation[]).forEach((inst) => {
      if (!inst.business?.id) return;
      const bid = inst.business.id;
      if (!clientMap.has(bid)) {
        clientMap.set(bid, {
          id: bid,
          name: inst.business.name,
          slug: inst.business.slug,
          logo: inst.business.logo,
          modules: [],
          installDate: inst.installedAt || inst.createdAt,
          lastActive: inst.createdAt,
          status: 'ACTIVE',
        });
      }
      const client = clientMap.get(bid)!;
      if (inst.module?.name && !client.modules.includes(inst.module.name)) {
        client.modules.push(inst.module.name);
      }
      const date = inst.installedAt || inst.createdAt;
      if (date && date < client.installDate) client.installDate = date;
      if (date && date > client.lastActive) client.lastActive = date;
      if (inst.status === 'UNINSTALLED') client.status = 'UNINSTALLED';
      else if (inst.status === 'DISABLED' && client.status !== 'UNINSTALLED') client.status = 'DISABLED';
    });

    return Array.from(clientMap.values());
  }, [installations]);

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.modules.some((m) => m.toLowerCase().includes(q))
      );
    }
    return list;
  }, [clients, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === 'ACTIVE').length,
    totalInstallations: installations.reduce((s: number, i: DeveloperModuleInstallation) => s + 1, 0),
  }), [clients, installations]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des clients..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description="Tous les business utilisant vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Clients' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total clients</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Actifs</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <Download className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalInstallations}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Installations totales</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                statusFilter === tab.id
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Rechercher par client ou module..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Aucun client trouvé" description={searchQuery ? 'Essayez une autre recherche.' : 'Aucun client pour le moment.'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Card key={client.id} hoverable className="group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                  {client.logo ? (
                    <Image src={client.logo ?? ''} alt="" fill className="rounded-xl object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : (
                    <Building2 className="h-5 w-5 text-brand" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{client.name}</h3>
                </div>
                <Badge variant={client.status === 'ACTIVE' ? 'success' : client.status === 'DISABLED' ? 'warning' : 'danger'} size="xs">
                  {client.status === 'ACTIVE' ? 'Actif' : client.status === 'DISABLED' ? 'Désactivé' : 'Désinstallé'}
                </Badge>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Modules installés : </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{client.modules.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Installé le</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {client.installDate ? new Date(client.installDate).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Dernière activité</span>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {client.lastActive ? new Date(client.lastActive).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-400">
                  {client.modules.length} module{client.modules.length > 1 ? 's' : ''}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
