'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Package, Truck, Briefcase, Building2, Wrench,
  Phone, Mail, Globe, MapPin, MessageCircle, Star,
  FileText, DollarSign, Calendar, Clock, CheckCircle,
  XCircle, AlertTriangle, Award, Edit3, Trash2,
  ArrowUpRight, ChevronLeft, Plus, Download, Camera, Music4, Handshake,
  TrendingUp, BadgeCheck, Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  usePartner, useDeletePartner,
  usePartnerContracts, usePartnerTransactions,
  usePartnerAssignments, usePartnerReviews,
  usePartnerDocuments, usePartnerPermissions,
} from '@/features/partnerHooks';

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  FOURNISSEUR: { label: 'Fournisseur', icon: Package, color: 'text-blue-600 bg-blue-50' },
  LIVREUR: { label: 'Livreur', icon: Truck, color: 'text-amber-600 bg-amber-50' },
  SERVICE: { label: 'Service', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
  COMMERCIAL: { label: 'Commercial', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
  TECHNIQUE: { label: 'Technique', icon: Wrench, color: 'text-rose-600 bg-rose-50' },
};

const COLLAB_LABELS: Record<string, string> = {
  PONCTUEL: 'Ponctuel', REGULIER: 'Régulier', STRATEGIQUE: 'Stratégique', PREMIUM: 'Premium',
};

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: partner, isLoading, error, refetch } = usePartner(id);
  const deletePartner = useDeletePartner();
  const { data: contracts } = usePartnerContracts({ partnerId: id });
  const { data: transactions } = usePartnerTransactions({ partnerId: id });
  const { data: assignments } = usePartnerAssignments({ partnerId: id });
  const { data: reviews } = usePartnerReviews({ partnerId: id });
  const { data: documents } = usePartnerDocuments({ partnerId: id });
  const { data: permissions } = usePartnerPermissions({ partnerId: id });
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) return <Loader />;
  if (error || !partner) return <ErrorState message="Partenaire non trouvé" onRetry={refetch} />;

  const p = partner as any;
  const catInfo = CATEGORY_MAP[p.category] || { label: p.category, icon: Users, color: 'text-gray-600 bg-gray-50' };
  const CatIcon = catInfo.icon;
  const collabLabel = COLLAB_LABELS[p.collaborationLevel] || p.collaborationLevel;

  const contractList: any[] = Array.isArray(contracts) ? contracts : [];
  const txList: any[] = Array.isArray(transactions) ? transactions : [];
  const assignmentList: any[] = Array.isArray(assignments) ? assignments : [];
  const reviewList: any[] = Array.isArray(reviews) ? reviews : [];
  const docList: any[] = Array.isArray(documents) ? documents : [];
  const permList: any[] = Array.isArray(permissions) ? permissions : [];

  const handleDelete = async () => {
    if (confirm('Désactiver ce partenaire ?')) {
      await deletePartner.mutateAsync(id);
      router.push('/dashboard/partners');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'contracts', label: `Contrats (${contractList.length})` },
    { id: 'transactions', label: `Paiements (${txList.length})` },
    { id: 'assignments', label: `Assignations (${assignmentList.length})` },
    { id: 'documents', label: `Documents (${docList.length})` },
    { id: 'permissions', label: 'Accès' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={p.name}
        description={`${catInfo.label} • ${collabLabel}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: p.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/partners/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit3 className="h-4 w-4 mr-1.5" />
                Modifier
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Désactiver
            </Button>
          </div>
        }
      />

      {/* Partner Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className={cn('p-4 rounded-2xl shrink-0 w-fit', catInfo.color)}>
            <CatIcon className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.name}</h2>
              {p.verifiedAt && (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Vérifié
                </Badge>
              )}
              <Badge className="bg-brand/10 text-brand">{catInfo.label}</Badge>
              <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {collabLabel}
              </Badge>
            </div>

            {p.description && <p className="text-sm text-gray-600 dark:text-gray-400">{p.description}</p>}

            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{p.score || 0}</span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-500">
                {reviewList.length} avis
              </span>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-sm text-gray-500">
                {contractList.length} contrats
              </span>
            </div>

            {/* Contact */}
            <div className="flex flex-wrap gap-4">
              {p.phone && (
                <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-brand transition-colors">
                  <Phone className="h-4 w-4" /> {p.phone}
                </a>
              )}
              {p.whatsapp && (
                <a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {p.email && (
                <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-brand transition-colors">
                  <Mail className="h-4 w-4" /> {p.email}
                </a>
              )}
              {p.website && (
                <a href={p.website} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-brand transition-colors">
                  <Globe className="h-4 w-4" /> Site web
                </a>
              )}
              {(p.address || p.city) && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" /> {[p.address, p.city, p.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Social */}
            <div className="flex flex-wrap gap-3">
              {p.facebook && <a href={p.facebook} target="_blank" className="text-blue-600 hover:text-blue-700"><Globe className="h-4 w-4" /></a>}
              {p.instagram && <a href={p.instagram} target="_blank" className="text-pink-600 hover:text-pink-700"><Camera className="h-4 w-4" /></a>}
              {p.linkedin && <a href={p.linkedin} target="_blank" className="text-blue-700 hover:text-blue-800"><Briefcase className="h-4 w-4" /></a>}
              {p.tiktok && <a href={p.tiktok} target="_blank" className="text-gray-600 hover:text-gray-700"><Music4 className="h-4 w-4" /></a>}
            </div>

            {/* Specialite & Zones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {p.specialite && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Spécialité</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.specialite}</p>
                </div>
              )}
              {p.zonesCouvertes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Zones couvertes</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.zonesCouvertes}</p>
                </div>
              )}
              {p.horairesDisponibilite && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Disponibilité</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.horairesDisponibilite}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats mini-cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Handshake className="h-5 w-5 mx-auto text-purple-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{contractList.length}</p>
              <p className="text-xs text-gray-500">Contrats</p>
            </Card>
            <Card className="p-4 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {txList.filter((t: any) => t.type === 'PAIEMENT').reduce((a: number, t: any) => a + (t.amount || 0), 0).toLocaleString()} F
              </p>
              <p className="text-xs text-gray-500">Paiements</p>
            </Card>
            <Card className="p-4 text-center">
              <ArrowUpRight className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{assignmentList.length}</p>
              <p className="text-xs text-gray-500">Assignations</p>
            </Card>
            <Card className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto text-amber-400 mb-1" />
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{reviewList.length}</p>
              <p className="text-xs text-gray-500">Avis</p>
            </Card>
          </div>

          {/* Services/Products */}
          {(p.servicesProposes || p.produitsFournis) && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Services & Produits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {p.servicesProposes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Services proposés</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{p.servicesProposes}</p>
                  </div>
                )}
                {p.produitsFournis && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Produits fournis</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{p.produitsFournis}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Recent Reviews */}
          {reviewList.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Avis récents</h3>
              <div className="space-y-3">
                {reviewList.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn('h-3.5 w-3.5', s <= r.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600')} fill={s <= r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{r.comment || 'Avis sans commentaire'}</p>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'contracts' && (
        <ContractsSection contracts={contractList} partnerId={id} />
      )}

      {activeTab === 'transactions' && (
        <TransactionsSection transactions={txList} partnerId={id} />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsSection assignments={assignmentList} />
      )}

      {activeTab === 'documents' && (
        <DocumentsSection documents={docList} partnerId={id} />
      )}

      {activeTab === 'permissions' && (
        <PermissionsSection permissions={permList} partnerId={id} />
      )}
    </div>
  );
}

// Sub-components for each tab

function ContractsSection({ contracts, partnerId }: { contracts: any[]; partnerId: string }) {
  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIF': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'EXPIRE': return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'RESILIE': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      case 'RENOUVELLE': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contrats & Accords</h3>
        <Link href={`/dashboard/partners/contracts/new?partnerId=${partnerId}`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nouveau contrat
          </Button>
        </Link>
      </div>
      {contracts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucun contrat</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.startDate).toLocaleDateString()} - {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Indéfini'}
                    {c.amount ? ` • ${c.amount.toLocaleString()} FCFA` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor(c.status)}>{c.status}</Badge>
                {c.signedByBusiness && c.signedByPartner && <CheckCircle className="h-4 w-4 text-emerald-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TransactionsSection({ transactions, partnerId }: { transactions: any[]; partnerId: string }) {
  const typeColor = (t: string) => {
    switch (t) {
      case 'PAIEMENT': return 'text-emerald-600';
      case 'COMMISSION': return 'text-blue-600';
      case 'AVANCE': return 'text-amber-600';
      case 'REMBOURSEMENT': return 'text-red-600';
      case 'PRET': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Paiements & Transactions</h3>
        <Link href={`/dashboard/partners/transactions/new?partnerId=${partnerId}`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nouveau paiement
          </Button>
        </Link>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucune transaction</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <DollarSign className={cn('h-5 w-5', typeColor(t.type))} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.type}</p>
                  <p className="text-xs text-gray-500">{t.description || ''} {t.paidAt ? new Date(t.paidAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.amount.toLocaleString()} FCFA</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AssignmentsSection({ assignments }: { assignments: any[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Assignations</h3>
      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucune assignation</p>
      ) : (
        <div className="space-y-2">
          {assignments.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.referenceTitle || a.type}</p>
                <p className="text-xs text-gray-500">{a.type} • {new Date(a.assignedAt).toLocaleDateString()}</p>
              </div>
              <Badge className={
                a.status === 'TERMINE' ? 'bg-emerald-50 text-emerald-700' :
                a.status === 'EN_COURS' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }>{a.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentsSection({ documents, partnerId }: { documents: any[]; partnerId: string }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucun document</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.title}</p>
                  <p className="text-xs text-gray-500">{d.type}{d.expiresAt ? ` • Expire le ${new Date(d.expiresAt).toLocaleDateString()}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.isVerified && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank">
                    <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PermissionsSection({ permissions, partnerId }: { permissions: any[]; partnerId: string }) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Accès & Permissions</h3>
      {permissions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucune permission définie</p>
      ) : (
        <div className="space-y-2">
          {permissions.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.module}</p>
                  <p className="text-xs text-gray-500">Niveau: {p.accessLevel}</p>
                </div>
              </div>
              <Badge className={p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}>
                {p.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}


