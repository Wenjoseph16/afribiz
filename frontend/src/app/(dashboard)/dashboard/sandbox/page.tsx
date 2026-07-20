'use client';

import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Play, RotateCcw, FileText, Terminal, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function SandboxPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sandbox'],
    queryFn: async () => {
      const res = await apiClient.getSandboxEnvironments();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const environments = Array.isArray(data) ? data : (data?.environments ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bac à sable"
        description="Environnement de test et simulation API"
        breadcrumbs={[{ label: 'Sandbox' }]}
        actions={
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Réinitialiser
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard
          icon={<FlaskConical className="h-5 w-5" />}
          label="Environnements"
          value={environments.length}
        />
        <StatsCard
          icon={<Play className="h-5 w-5" />}
          label="Tests effectués"
          value={data?.totalTests ?? 0}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Succès"
          value={data?.successRate ?? '0%'}
        />
      </div>

      <Card title="Environnements de test" titleIcon={<Terminal className="h-4 w-4" />}>
        {environments.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-10 w-10" />}
            title="Aucun environnement"
            description="Créez un environnement de test pour simuler vos API"
          />
        ) : (
          <div className="space-y-2">
            {environments.map((env: any) => (
              <div
                key={env.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${env.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <Play
                      className={`h-4 w-4 ${env.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{env.name}</p>
                    <p className="text-xs text-gray-500">
                      {env.description || `Environnement ${env.type || 'test'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={env.status === 'active' ? 'success' : 'default'}>
                    {env.status}
                  </Badge>
                  <button className="px-2.5 py-1 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand-dark">
                    Tester
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
