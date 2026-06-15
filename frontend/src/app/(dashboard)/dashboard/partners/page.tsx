'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, UserPlus, Package, Truck,
  Briefcase, Building2, Wrench, Star, FileText,
  TrendingUp, DollarSign, Shield, Handshake,
  Filter, ArrowUpDown, MoreHorizontal, Eye, Pencil,
  Phone, Mail, MapPin, Globe, ChevronRight,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { usePartners, usePartnerStats } from '@/features/partnerHooks';

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  FOURNISSEUR: { label: 'Fournisseur', icon: Package, color: 'text-blue-600 bg-blue-50' },
  LIVREUR: { label: 'Livreur', icon: Truck, color: 'text-amber-600 bg-amber-50' },
  SERVICE: { label: 'Service', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
  COMMERCIAL: { label: 'Commercial', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
  TECHNIQUE: { label: 'Technique', icon: Wrench, color: 'text-rose-600 bg-rose-50' },
};

const STATUS_OPTIONS = ['TOUS', 'FOURNISSEUR', 'LIVREUR', 'SERVICE', 'COMMERCIAL', 'TECHNIQUE'];

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TOUS');
  const [sortBy, setSortBy] = useState('name');
  const { data: partnersData, isLoading, refetch } = usePartners({
    search: searchQuery || undefined,
    category: categoryFilter !== 'TOUS' ? categoryFilter : undefined,
  });
  const { data: stats } = usePartnerStats();

  const partners: any[] = Array.isArray(partnersData)
    ? partnersData
    : (partnersData?.data || []);

  const catInfo = (cat: string) => CATEGORY_MAP[cat] || { label: cat, icon: Users, color: 'text-gray-600 bg-gray-50' };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Partenaires"
        description="Gérez vos fournisseurs, livreurs, prestataires et partenaires commerciaux"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Partenaires' }]}
        actions={
          <Link href="/dashboard/partners/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter un partenaire
            </Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard icon={<Users className="h-5 w-5" />} iconColor="text-blue-600" iconBg="bg-blue-50"
          label="Partenaires" value={stats?.total || 0} />
        <StatsCard icon={<Star className="h-5 w-5" />} iconColor="text-emerald-600" iconBg="bg-emerald-50"
          label="Actifs" value={stats?.actif || 0} />
        <StatsCard icon={<Handshake className="h-5 w-5" />} iconColor="text-purple-600" iconBg="bg-purple-50"
          label="Collaborations" value={stats?.collaborations || 0} />
        <StatsCard icon={<DollarSign className="h-5 w-5" />} iconColor="text-amber-600" iconBg="bg-amber-50"
          label="Revenus générés" value={`${(stats?.revenusGeneres || 0).toLocaleString()} FCFA`} />
        <StatsCard icon={<FileText className="h-5 w-5" />} iconColor="text-rose-600" iconBg="bg-rose-50"
          label="Contrats actifs" value={stats?.contratsActifs || 0} />
        <StatsCard icon={<Shield className="h-5 w-5" />} iconColor="text-indigo-600" iconBg="bg-indigo-50"
          label="Vérifiés" value={stats?.partenairesVerifies || 0} />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setCategoryFilter(opt)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                categoryFilter === opt
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {opt === 'TOUS' ? 'Tous' : CATEGORY_MAP[opt]?.label || opt}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List */}
      {partners.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aucun partenaire</h3>
          <p className="text-sm text-gray-500 mb-6">Ajoutez votre premier partenaire pour centraliser vos relations professionnelles</p>
          <Link href="/dashboard/partners/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Ajouter un partenaire
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner: any) => {
            const info = catInfo(partner.category);
            const Icon = info.icon;
            return (
              <Link key={partner.id} href={`/dashboard/partners/${partner.id}`}>
                <Card className="p-5 hover:border-brand/20 dark:hover:border-brand/30 hover:shadow-card-hover transition-all duration-300 card-hover group h-full">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-xl shrink-0', info.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{partner.name}</h3>
                          <span className="text-xs text-gray-500">{info.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Score */}
                      {typeof partner.score === 'number' && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{partner.score}</span>
                          <span className="text-xs text-gray-400">/100</span>
                        </div>
                      )}

                      {/* Contact */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {partner.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" /> {partner.phone}
                          </span>
                        )}
                        {partner.email && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 truncate max-w-[160px]">
                            <Mail className="h-3 w-3" /> {partner.email}
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {partner.verifiedAt && (
                          <Badge className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Vérifié
                          </Badge>
                        )}
                        <Badge className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {partner._count?.contracts || 0} contrats
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
