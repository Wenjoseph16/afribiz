'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Share2,
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  QrCode,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

/**
 * Chantier 10 — Dashboard Affiliation
 *
 * Page centrale pour le gérant :
 * - Voir ses stats (clics, commandes, gains)
 * - Gérer ses liens d'affiliation
 * - Partager via WhatsApp / copier le lien
 * - Créer de nouveaux liens
 */
export default function AffiliationPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Récupérer les liens d'affiliation
  const { data: linksData, isLoading } = useQuery({
    queryKey: ['affiliateLinks'],
    queryFn: () => apiClient.getAffiliateLinks(),
  });

  const links = (linksData as any)?.data?.data || [];

  // Stats globales
  const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0);
  const totalOrders = links.reduce((sum: number, l: any) => sum + (l.orders || 0), 0);
  const totalEarnings = links.reduce((sum: number, l: any) => sum + Number(l.commissionTotal || 0), 0);

  // Mutation supprimer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAffiliateLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliateLinks'] });
    },
  });

  // Copier le lien
  const copyLink = (code: string, id: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Partager WhatsApp
  const shareWhatsApp = (code: string, itemName: string) => {
    const url = `${window.location.origin}/r/${code}`;
    const text = `Découvre "${itemName}" sur AfriBiz ! 🛍️\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Programme d'Affiliation"
        description="Partagez vos produits, chaque vente vous rapporte une commission"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Affiliation' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointerClick className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalClicks}</p>
              <p className="text-xs text-gray-500">Clics</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalOrders}</p>
              <p className="text-xs text-gray-500">Commandes</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalEarnings.toLocaleString()} FCFA
              </p>
              <p className="text-xs text-gray-500">Gains totaux</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalClicks > 0 ? Math.round((totalOrders / totalClicks) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">Taux conversion</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des liens */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Vos liens d'affiliation ({links.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Chargement…</div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucun lien d'affiliation
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Créez un lien pour un produit et partagez-le
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link: any) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-brand/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {link.itemName || link.itemType}
                    </span>
                    <LiveBadge
                      tone={link.isActive ? 'success' : 'muted'}
                      label={link.isActive ? 'Actif' : 'Inactif'}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{link.commissionPercent}% commission</span>
                    <span>{link.clicks || 0} clics</span>
                    <span>{link.orders || 0} commandes</span>
                    <span className="font-medium text-emerald-600">
                      {Number(link.commissionTotal || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Copier */}
                  <button
                    onClick={() => copyLink(link.code, link.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Copier le lien"
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={() => shareWhatsApp(link.code, link.itemName)}
                    className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    title="Partager sur WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                  </button>

                  {/* Voir */}
                  <Link
                    href={`/r/${link.code}`}
                    target="_blank"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Link>

                  {/* Supprimer */}
                  <button
                    onClick={() => {
                      if (confirm("Supprimer ce lien d'affiliation ?")) {
                        deleteMutation.mutate(link.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Comment ça marche */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Comment ça marche ?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Créez un lien</p>
              <p className="text-xs">Choisissez un produit et un % de commission</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Partagez</p>
              <p className="text-xs">WhatsApp, Facebook, bouche-à-oreille…</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Gagnez</p>
              <p className="text-xs">Chaque vente via votre lien = commission créditée</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
