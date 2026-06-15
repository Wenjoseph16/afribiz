'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Pen, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default'> = { SIGNED: 'success', PENDING: 'warning', EXPIRED: 'default' };
const STATUS_LABELS: Record<string, string> = { PENDING: 'En attente', SIGNED: 'Signé', EXPIRED: 'Expiré' };

export default function SignaturesPage() {
  const { data: signatures, isLoading } = useQuery({
    queryKey: ['signature-requests'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/documents/requests');
        return res.data.data || [];
      } catch { return []; }
    },
  });

  if (isLoading) return <Loader />;
  const list = Array.isArray(signatures) ? signatures : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Signatures électroniques" description="Gérez les demandes de signature de vos documents" />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: list.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Pen },
          { label: 'Signées', value: list.filter((s: any) => s.status === 'SIGNED').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
          { label: 'En attente', value: list.filter((s: any) => s.status === 'PENDING').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
        ].map((s, i) => {
          const Icon = s.icon;
          return (<div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className={cn('p-2.5 rounded-lg w-fit', s.bg)}><Icon className={cn('h-5 w-5', s.color)} /></div>
            <p className="text-2xl font-bold mt-2">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>);
        })}
      </div>

      {list.length > 0 ? (
        <div className="space-y-2">
          {list.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/20 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg shrink-0', s.status === 'SIGNED' ? 'bg-emerald-50' : 'bg-amber-50')}>
                  {s.status === 'SIGNED' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-amber-600" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.signerName || s.signerEmail}</p>
                  <p className="text-xs text-gray-500">{s.signerEmail} • {s.document?.title || 'Document'}</p>
                  {s.signedAt && <p className="text-[10px] text-gray-400">Signé le {new Date(s.signedAt).toLocaleDateString('fr-FR')}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_BADGE[s.status] || 'default'}>{STATUS_LABELS[s.status] || s.status}</Badge>
                {s.status === 'PENDING' && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />Lien
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Pen className="h-12 w-12" />} title="Aucune demande de signature" description="Les demandes de signature apparaîtront ici" />
      )}
    </div>
  );
}
