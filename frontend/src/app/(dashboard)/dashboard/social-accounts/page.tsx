'use client';

import { useQuery } from '@tanstack/react-query';
import { Share2, Link2, Unlink, Plus, Globe, MessageCircle, Hash } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

const platformIcons: Record<string, any> = {
  whatsapp: MessageCircle,
  instagram: Hash,
  facebook: Globe,
  twitter: Globe,
  linkedin: Globe,
};

export default function SocialAccountsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const res = await apiClient.getSocialAccounts();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const accounts = Array.isArray(data) ? data : (data?.accounts ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Comptes sociaux"
        description="Connectez vos réseaux sociaux et plateformes de messagerie"
        breadcrumbs={[{ label: 'Comptes sociaux' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Connecter
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Share2 className="h-10 w-10" />}
          title="Aucun compte connecté"
          description="Connectez vos réseaux sociaux pour automatiser vos publications"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc: any) => {
            const Icon = platformIcons[acc.platform] || Globe;
            return (
              <Card key={acc.id} hoverable className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{acc.platform}</p>
                    <p className="text-xs text-gray-500">{acc.username || acc.email}</p>
                  </div>
                  <Badge variant={acc.connected ? 'success' : 'danger'}>
                    {acc.connected ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-400">
                    Dernière sync:{' '}
                    {acc.lastSync ? new Date(acc.lastSync).toLocaleDateString() : 'Jamais'}
                  </span>
                  <button className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                    <Unlink className="h-3 w-3" />
                    Déconnecter
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
