'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import { DollarSign, Save, X, Edit3, MapPin } from 'lucide-react';

type AdSlot = {
  id: string;
  page: string;
  position: string;
  label: string;
  width: number;
  height: number;
  price1Day: number;
  price7Days: number;
  price30Days: number;
  maxPerSlot: number;
  isActive: boolean;
  _count?: { campaigns: number };
};

const PAGE_LABELS: Record<string, string> = {
  HOMEPAGE: 'Accueil',
  MARKETPLACE: 'Marketplace',
  PRODUCT_PAGE: 'Page produit',
  EVENT_PAGE: 'Événements',
  ABOUT: 'À propos',
  PRICING: 'Tarifs',
  CONTACT: 'Contact',
  LEGAL: 'Mentions légales',
  MEDIA: 'Média',
  DEVELOPERS: 'Développeurs',
  BLOG: 'Blog',
  BLOG_ARTICLE: 'Article blog',
  FEED: 'Fil actu',
  DASHBOARD_CLIENT: 'Dashboard client',
  DASHBOARD_BUSINESS: 'Dashboard business',
  DASHBOARD_DEVELOPER: 'Dashboard dev',
  MODULE_PAGE: 'Page module',
  NOTIFICATION_CENTER: 'Notifications',
  BUSINESS_PUBLIC_PAGE: 'Page business',
};

export default function AdminSlotsPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdSlot>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads-slots'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/ads/slots');
      return res.data.data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; body: Partial<AdSlot> }) => {
      return apiClient.patch(`/admin/ads/slots/${data.id}`, data.body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ads-slots'] });
      setEditingId(null);
      setForm({});
    },
  });

  const slots: AdSlot[] = data || [];

  const startEdit = (slot: AdSlot) => {
    setEditingId(slot.id);
    setForm({
      price1Day: Number(slot.price1Day),
      price7Days: Number(slot.price7Days),
      price30Days: Number(slot.price30Days),
      maxPerSlot: slot.maxPerSlot,
      isActive: slot.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveSlot = (id: string) => {
    updateMutation.mutate({ id, body: form });
  };

  if (isLoading) return <Loader className="min-h-[60vh]" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageHeader
        title="Prix des emplacements publicitaires"
        description="Configurez les tarifs par emplacement x durée. Les prix sont en FCFA."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/admin' },
          { label: 'Publicités', href: '/dashboard/admin/ads' },
          { label: 'Emplacements' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {slots.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun emplacement configuré.</p>
          </Card>
        ) : (
          slots.map((slot) => {
            const isEditing = editingId === slot.id;
            return (
              <Card key={slot.id} className="p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {slot.label}
                      </h3>
                      <Badge variant={slot.isActive ? 'success' : 'default'}>
                        {slot.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Badge variant="default" className="text-[10px]">
                        {slot.width}*{slot.height}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {PAGE_LABELS[slot.page] || slot.page} . {slot.position}
                      {slot._count?.campaigns != null && (
                        <span className="ml-2">. {slot._count.campaigns} campagne(s)</span>
                      )}
                    </p>

                    {isEditing ? (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500">1 jour</label>
                          <input
                            type="number"
                            value={form.price1Day ?? 0}
                            onChange={(e) =>
                              setForm({ ...form, price1Day: Number(e.target.value) })
                            }
                            className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500">7 jours</label>
                          <input
                            type="number"
                            value={form.price7Days ?? 0}
                            onChange={(e) =>
                              setForm({ ...form, price7Days: Number(e.target.value) })
                            }
                            className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500">30 jours</label>
                          <input
                            type="number"
                            value={form.price30Days ?? 0}
                            onChange={(e) =>
                              setForm({ ...form, price30Days: Number(e.target.value) })
                            }
                            className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-gray-500">
                            Max pubs
                          </label>
                          <input
                            type="number"
                            value={form.maxPerSlot ?? 10}
                            onChange={(e) =>
                              setForm({ ...form, maxPerSlot: Number(e.target.value) })
                            }
                            className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="default" className="text-xs gap-1">
                          <DollarSign className="h-3 w-3" />
                          1j: {Number(slot.price1Day).toLocaleString('fr-FR')} F
                        </Badge>
                        <Badge variant="default" className="text-xs gap-1">
                          <DollarSign className="h-3 w-3" />
                          7j: {Number(slot.price7Days).toLocaleString('fr-FR')} F
                        </Badge>
                        <Badge variant="default" className="text-xs gap-1">
                          <DollarSign className="h-3 w-3" />
                          30j: {Number(slot.price30Days).toLocaleString('fr-FR')} F
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          Max: {slot.maxPerSlot}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => saveSlot(slot.id)}
                          disabled={updateMutation.isPending}
                          className="text-xs gap-1"
                        >
                          <Save className="h-3 w-3" />
                          {updateMutation.isPending ? '...' : 'Sauver'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={cancelEdit}
                          className="text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(slot)}
                        className="text-xs gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Modifier
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}