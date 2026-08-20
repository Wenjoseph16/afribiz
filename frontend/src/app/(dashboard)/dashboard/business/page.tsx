'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Eye, Settings, QrCode, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyBusiness } from '@/features/hooks/business';
import { useBusinessStats } from '@/features/hooks/business';
import { useOrders } from '@/features/hooks/orders';
import { useBookings } from '@/features/hooks/bookings';
import { useReviews } from '@/features/hooks/reviews';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// Cockpit zone components
import { Zone1Tatan } from '@/components/dashboard/cockpit/Zone1Tatan';
import { Zone2Tendance } from '@/components/dashboard/cockpit/Zone2Tendance';
import { Zone3Details } from '@/components/dashboard/cockpit/Zone3Details';
import { HealthMiniCard } from '@/components/dashboard/cockpit/HealthMiniCard';

// Heavy dynamic imports
const BusinessQrModal = dynamic(
  () =>
    import('@/components/dashboard/BusinessQrModal').then((mod) => ({
      default: mod.BusinessQrModal,
    })),
  { ssr: false, loading: () => null }
);

// ─── Aggregated stats type (from GET /business/stats/aggregated) ───
interface AggregatedStats {
  today: {
    ordersCount: number;
    bookingsCount: number;
    revenue: number;
    newClients: number;
  };
  pending: {
    ordersCount: number;
    debtsAmount: number;
  };
  alerts: {
    lowStock: number;
  };
  trends: {
    revenueToday: number;
    revenueYesterday: number;
  };
  history: Array<{ date: string; revenue: number; orders: number }>;
}

// ─── Cash widget type ───
interface CashWidget {
  isOpen: boolean;
  currentBalance: number;
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();
  const [qrOpen, setQrOpen] = useState(false);

  const {
    data: myBusiness,
    isLoading: bizLoading,
    error: bizError,
    refetch: bizRefetch,
  } = useMyBusiness();

  // Guard: redirect to onboarding if no business profile
  const canAccess = user?.roles?.includes('BUSINESS');
  const hasProfile = !!(business || myBusiness);
  useEffect(() => {
    if (user && canAccess && !bizLoading && !bizError && !hasProfile) {
      router.replace('/dashboard/business/onboarding');
    }
  }, [user, canAccess, bizLoading, bizError, hasProfile, router]);

  // Data hooks
  const { data: stats, error: statsError } = useBusinessStats();
  const { data: ordersData } = useOrders({ limit: 3 });
  const { data: bookingsData } = useBookings({ limit: 3 });
  const { data: reviewsData } = useReviews({ limit: 3 });

  // Aggregated stats for charts
  const { data: aggStats } = useQuery<AggregatedStats>({
    queryKey: ['business-stats', 'aggregated'],
    queryFn: async () => {
      const res = await apiClient.get('/business/stats/aggregated');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  // Cash widget
  const { data: cashWidget } = useQuery<CashWidget>({
    queryKey: ['cash-widget'],
    queryFn: async () => {
      const res = await apiClient.getTodayCash();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Guard: non-business user
  if (user && !canAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Accès Business</h2>
          <p className="text-sm text-slate-500 mb-6">
            Vous devez avoir un rôle BUSINESS pour accéder à cet espace.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (bizError) return <ErrorState message={bizError.message} onRetry={bizRefetch} />;
  if (statsError) return <ErrorState message={statsError.message} />;

  const biz = business || myBusiness;
  const firstName = user?.firstName || 'Cher';

  const orders = ordersData?.orders ?? [];
  const bookings = bookingsData?.bookings ?? [];
  const reviews = Array.isArray(reviewsData?.reviews || reviewsData)
    ? (reviewsData?.reviews || reviewsData)
    : [];

  // Compute order status breakdown for donut chart
  const orderStatusBreakdown = useMemo(() => {
    const counts = { delivered: 0, confirmed: 0, pending: 0, cancelled: 0 };
    for (const o of orders) {
      switch (o.status) {
        case 'DELIVERED': counts.delivered++; break;
        case 'CONFIRMED': counts.confirmed++; break;
        case 'CANCELLED': counts.cancelled++; break;
        default: counts.pending++; break;
      }
    }
    return counts;
  }, [orders]);

  // Aggregated data with safe defaults
  const agg: AggregatedStats = aggStats ?? {
    today: { ordersCount: 0, bookingsCount: 0, revenue: 0, newClients: 0 },
    pending: { ordersCount: 0, debtsAmount: 0 },
    alerts: { lowStock: 0 },
    trends: { revenueToday: 0, revenueYesterday: 0 },
    history: [],
  };

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Chargement du cockpit…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {biz ? biz.name : 'Votre espace professionnel'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {biz?.slug && (
            <Link href={`/business/${biz.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1.5" />
                Voir ma page
              </Button>
            </Link>
          )}
          {biz?.slug && (
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4 mr-1.5" />
              QR
            </Button>
          )}
          <Link href="/dashboard/public-page">
            <Button size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Configurer
            </Button>
          </Link>
        </div>
      </div>

      <BusinessQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        businessName={biz?.name || 'Mon business'}
        slug={biz?.slug || ''}
        logo={biz?.logo}
      />

      {/* ═══ ZONE 1 : LE TATAN ═══ */}
      <Zone1Tatan
        today={agg.today}
        pending={agg.pending}
        trends={agg.trends}
        alerts={agg.alerts}
        caisseOuverte={cashWidget?.isOpen ?? false}
        caisseMontant={cashWidget?.currentBalance ?? 0}
      />

      {/* ═══ ZONE 2 : LA TENDANCE ═══ */}
      <Zone2Tendance
        history={agg.history}
        orderStatusBreakdown={orderStatusBreakdown}
      />

      {/* ═══ ZONE 3 : LES DÉTAILS ═══ */}
      <Zone3Details
        orders={orders}
        bookings={bookings}
        reviews={reviews}
        modules={biz?.modules || []}
      />

      {/* ═══ SANTÉ ═══ */}
      <HealthMiniCard
        afriscore={stats?.satisfactionRate ?? 0}
        reviewCount={stats?.reviewsReceived ?? 0}
        avgRating={biz?.rating ?? 0}
        verificationLevel={biz?.verificationLevel}
      />
    </div>
  );
}
