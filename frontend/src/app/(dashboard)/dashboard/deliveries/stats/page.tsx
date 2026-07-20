'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Gauge,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';
import { ErrorState } from '@/components/ui/ErrorState';

export default function DeliveryStatsPage() {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['deliveries', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/business/deliveries/stats');
      return res.data.data as any;
    },
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['deliveries', 'list', 'all'],
    queryFn: async () => {
      const res = await apiClient.get('/business/deliveries?limit=500');
      return res.data.data;
    },
  });

  const allDeliveries = useMemo(() => {
    if (!deliveriesData) return [];
    return Array.isArray(deliveriesData)
      ? deliveriesData
      : deliveriesData?.deliveries || deliveriesData?.data || [];
  }, [deliveriesData]);

  const dailyStats = useMemo(() => {
    const map: Record<string, { count: number; delivered: number; minutes: number[] }> = {};
    allDeliveries.forEach((d: any) => {
      const day = (d.createdAt || '').split('T')[0];
      if (!day) return;
      if (!map[day]) map[day] = { count: 0, delivered: 0, minutes: [] };
      map[day].count++;
      if (d.status === 'DELIVERED') map[day].delivered++;
      if (d.actualMinutes) map[day].minutes.push(Number(d.actualMinutes));
    });
    return Object.entries(map)
      .slice(-30)
      .map(([date, v]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        count: v.count,
        delivered: v.delivered,
        avgTime:
          v.minutes.length > 0
            ? Math.round(v.minutes.reduce((a: number, b: number) => a + b, 0) / v.minutes.length)
            : 0,
      }));
  }, [allDeliveries]);

  const zoneStats = useMemo(() => {
    const map: Record<string, { count: number; delivered: number; minutes: number[] }> = {};
    allDeliveries.forEach((d: any) => {
      const zone = d.zone?.name || d.zoneName || 'Sans zone';
      if (!map[zone]) map[zone] = { count: 0, delivered: 0, minutes: [] };
      map[zone].count++;
      if (d.status === 'DELIVERED') map[zone].delivered++;
      if (d.actualMinutes) map[zone].minutes.push(Number(d.actualMinutes));
    });
    return Object.entries(map)
      .map(([name, v]) => ({
        name,
        count: v.count,
        delivered: v.delivered,
        rate: v.count > 0 ? Math.round((v.delivered / v.count) * 100) : 0,
        avgTime:
          v.minutes.length > 0
            ? Math.round(v.minutes.reduce((a, b) => a + b, 0) / v.minutes.length)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allDeliveries]);

  const maxDaily = Math.max(...dailyStats.map((d) => d.count), 1);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/deliveries" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques livraisons</h1>
          <p className="text-sm text-gray-500">Analyse détaillée de vos livraisons</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold">{rawData?.total || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Livrées</p>
              <p className="text-xl font-bold">{rawData?.delivered || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En transit</p>
              <p className="text-xl font-bold">{rawData?.inTransit || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Gauge className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Taux réussite</p>
              <p className="text-xl font-bold">{rawData?.deliveryRate || 0}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Durée moyenne</p>
              <p className="text-xl font-bold">{Math.round(rawData?.averageMinutes || 0)} min</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Chauffeurs dispo</p>
              <p className="text-xl font-bold">{rawData?.availableDrivers || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Chart */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand" />
          <h3 className="font-semibold text-sm text-gray-900">Livraisons par jour (30 jours)</h3>
        </div>
        <div className="flex items-end gap-1 h-32">
          {dailyStats.map((d, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {d.count > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                  {d.count} livr. · {d.avgTime}min
                </div>
              )}
              <div
                className="w-full flex flex-col items-center"
                style={{ height: `${Math.max((d.count / maxDaily) * 100, d.count > 0 ? 2 : 0)}%` }}
              >
                <div
                  className="w-full flex-1 rounded-t-sm bg-brand/80"
                  style={{ height: `${(d.delivered / Math.max(d.count, 1)) * 100}%` }}
                />
              </div>
              {dailyStats.length <= 15 && (
                <span className="text-[7px] text-gray-400 mt-1">{d.date.split(' ')[0]}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Zone Performance */}
      {zoneStats.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-sm text-gray-900">Performance par zone</h3>
          </div>
          <div className="space-y-3">
            {zoneStats.map((z) => (
              <div key={z.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{z.name}</span>
                  <span className="text-gray-500">
                    {z.count} livr. · {z.avgTime}min · {z.rate}% réussite
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${z.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
