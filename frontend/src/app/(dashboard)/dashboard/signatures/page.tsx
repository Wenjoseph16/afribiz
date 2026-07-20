'use client';

import { useQuery } from '@tanstack/react-query';
import { Pen, FileSignature, Plus, Download, Eye, Clock } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function SignaturesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['signatures'],
    queryFn: async () => {
      const res = await apiClient.getSignatures();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const signatures = Array.isArray(data) ? data : (data?.signatures ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Signature électronique"
        description="Gérez vos documents signés numériquement"
        breadcrumbs={[{ label: 'Signatures' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle signature
          </Button>
        }
      />

      <Card title="Documents signés" titleIcon={<FileSignature className="h-4 w-4" />}>
        {signatures.length === 0 ? (
          <EmptyState
            icon={<Pen className="h-10 w-10" />}
            title="Aucun document signé"
            description="Les documents signés électroniquement apparaîtront ici"
          />
        ) : (
          <div className="space-y-2">
            {signatures.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <FileSignature className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title || s.documentName}</p>
                    <p className="text-xs text-gray-500">Signé par {s.signedBy || s.userName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      s.status === 'signed'
                        ? 'success'
                        : s.status === 'pending'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {s.status}
                  </Badge>
                  <button className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                    <Download className="h-4 w-4" />
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
