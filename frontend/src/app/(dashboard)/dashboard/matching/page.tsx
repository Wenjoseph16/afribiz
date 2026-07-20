'use client';

import { useQuery } from '@tanstack/react-query';
import { GitCompare, Users, Handshake, Star, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import Link from 'next/link';

export default function MatchingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['matching'],
    queryFn: async () => {
      const res = await apiClient.getMatchingSuggestions();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const suggestions = Array.isArray(data) ? data : (data?.suggestions ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mise en relation"
        description="Découvrez des partenaires et collaborateurs potentiels"
        breadcrumbs={[{ label: 'Matching' }]}
      />

      <Card title="Suggestions" titleIcon={<GitCompare className="h-4 w-4" />}>
        {suggestions.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Aucune suggestion"
            description="Des partenaires potentiels vous seront suggérés selon votre profil"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any) => (
              <div key={s.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name || s.businessName}</p>
                    <p className="text-xs text-gray-500">{s.category || s.type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {s.city}
                        {s.country ? `, ${s.country}` : ''}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                        <Star className="h-3 w-3" />
                        {s.matchScore ?? s.rating ?? 0}%
                      </span>
                    </div>
                  </div>
                  <button className="px-2.5 py-1 text-xs font-medium rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors">
                    Contacter
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
