'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Activity, Eye, MousePointerClick, ShoppingBag, Calendar,
  MessageCircle, Star, Award, ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import Image from 'next/image';
import { useCustomer360 } from '@/features/crm/hooks';

const activityIcons: Record<string, React.ElementType<{ className?: string }>> = {
  PAGE_VIEW: Eye,
  PRODUCT_VIEW: Eye,
  PRODUCT_CLICK: MousePointerClick,
  ORDER_PLACED: ShoppingBag,
  ORDER_COMPLETED: CheckIcon,
  BOOKING_MADE: Calendar,
  BOOKING_CANCELLED: Calendar,
  REVIEW_WRITTEN: Star,
  NOTE_ADDED: MessageCircle,
  TAG_ASSIGNED: Award,
  SEGMENT_CHANGED: Activity,
  MESSAGE_SENT: MessageCircle,
  PROMOTION_CLICKED: ExternalLink,
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function TimelineItem({ activity }: { activity: any }) {
  const Icon = activityIcons[activity.type] || Activity;
  return (
    <div className="flex gap-3 py-2.5">
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{activity.description || activity.type}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(activity.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export default function Customer360Page() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: data360, isLoading, error } = useCustomer360(clientId);

  if (isLoading) return <Loader variant="spinner" size="lg" fullScreen />;
  if (error) return <ErrorState title="Erreur" message="Impossible de charger les données 360°" onRetry={() => router.refresh()} />;
  if (!data360) return <ErrorState title="Client non trouvé" message="Ce client n'existe pas" />;

  const bc = data360;
  const clientName = bc.client?.fullName || `${bc.firstName || ''} ${bc.lastName || ''}`.trim() || 'Client';
  const timeline = Array.isArray(bc.activityTimeline) ? bc.activityTimeline : [];
  const pageViews = Array.isArray(bc.pageViews) ? bc.pageViews : [];
  const productViews = Array.isArray(bc.productViews) ? bc.productViews : [];
  const productClicks = Array.isArray(bc.productClicks) ? bc.productClicks : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push(`/dashboard/clients/${clientId}`)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
          <p className="text-sm text-muted-foreground">Vue 360° du client</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-brand">{pageViews.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pages visitées</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-blue-600">{productViews.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Produits vus</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-purple-600">{productClicks.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Clics produits</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-amber-600">{timeline.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Activités</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-foreground">Timeline d'activité</h3>
            </div>
            {timeline.length === 0 ? (
              <EmptyState icon={<Activity className="h-8 w-8" />} title="Aucune activité" description="Le client n'a pas encore d'activité enregistrée." />
            ) : (
              <div className="divide-y divide-border/50">
                {timeline.map((a: any) => (
                  <TimelineItem key={a.id} activity={a} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar — Product Views & Clicks */}
        <div className="space-y-4">
          {/* Product Views */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-foreground">Produits consultés</h3>
            </div>
            {productViews.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun produit consulté.</p>
            ) : (
              <div className="space-y-2">
                {productViews.slice(0, 10).map((v: any) => (
                  <div key={v.id} className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {v.product?.image ? (
                        <Image src={v.product.image} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          {v.product?.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{v.product?.name || 'Produit'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.product?.price?.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Product Clicks */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <MousePointerClick className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-foreground">Clics produits</h3>
            </div>
            {productClicks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun clic enregistré.</p>
            ) : (
              <div className="space-y-2">
                {productClicks.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {c.product?.image ? (
                        <Image src={c.product.image} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                          {c.product?.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{c.product?.name || 'Produit'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.source || 'marketplace'} · {new Date(c.clickedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom: Page views list */}
      {pageViews.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">Visites de la page business</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {pageViews.map((v: any) => (
              <div key={v.id} className="p-3 rounded-xl bg-muted/50 text-xs">
                <p className="text-muted-foreground">
                  {new Date(v.viewedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {v.referrer && <p className="text-foreground mt-0.5 truncate">Via: {v.referrer}</p>}
                {v.duration ? <p className="text-muted-foreground mt-0.5">{v.duration}s passées</p> : null}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
