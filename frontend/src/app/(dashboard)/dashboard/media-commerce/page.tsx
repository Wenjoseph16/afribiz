'use client';

import { useQuery } from '@tanstack/react-query';
import { Play, Image, Film, Plus, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function MediaCommercePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['media-commerce'],
    queryFn: async () => {
      const res = await apiClient.getMediaCommerceItems();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const items = Array.isArray(data) ? data : (data?.items ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Media Commerce"
        description="Gérez vos contenus multimédias commerciaux"
        breadcrumbs={[{ label: 'Media Commerce' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Ajouter un média
          </Button>
        }
      />

      <Card title="Médias" titleIcon={<Film className="h-4 w-4" />}>
        {items.length === 0 ? (
          <EmptyState
            icon={<Image className="h-10 w-10" />}
            title="Aucun média"
            description="Ajoutez des images et vidéos pour enrichir votre catalogue"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="group relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <div className="aspect-square flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full bg-black">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <Image className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white font-medium truncate">
                      {item.name || item.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-white/70 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {item.views ?? 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-3 w-3" />
                        {item.likes ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="absolute top-2 left-2 text-[10px]">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
