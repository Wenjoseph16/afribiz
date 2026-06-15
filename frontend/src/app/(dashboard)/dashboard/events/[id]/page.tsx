'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Trash2, Loader, CalendarDays, Clock, MapPin, Users, Star,
  History, TrendingUp, Activity, Ticket, Search, CreditCard, QrCode, Percent,
  Image, Handshake, BarChart3, Check, X, Plus, DollarSign, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import {
  useMyEvent, useDeleteEvent,
  useEventTickets, useCreateEventTicket, useDeleteEventTicket,
  useEventParticipants, useUpdateParticipantStatus,
  useEventScans, useScanTicket,
  useEventPromotions, useCreateEventPromotion, useDeleteEventPromotion,
  useEventGallery, useAddEventGalleryItem, useDeleteEventGalleryItem,
  useEventPartners, useAddEventPartner, useRemoveEventPartner,
  useEventStats,
} from '@/features/hooks';

type TabId = 'info' | 'billetterie' | 'participants' | 'scan' | 'promotions' | 'galerie' | 'partenaires' | 'statistiques';

interface TicketForm {
  name: string; type: string; price: string; quantity: string; benefits: string; saleEndAt: string;
}

interface PromoForm {
  code: string; description: string; discountType: string; discountValue: string; maxUses: string; minTickets: string; startsAt: string; endsAt: string;
}

interface GalleryForm {
  url: string; type: string; caption: string;
}

interface PartnerForm {
  name: string; logoUrl: string; website: string; isSponsor: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: event, isLoading, error, refetch } = useMyEvent(id);
  const deleteEvent = useDeleteEvent();
  const { data: tickets, refetch: refetchTickets } = useEventTickets(id);
  const createTicket = useCreateEventTicket();
  const deleteTicket = useDeleteEventTicket();
  const { data: participants, refetch: refetchParticipants } = useEventParticipants(id);
  const updateParticipantStatus = useUpdateParticipantStatus();
  const { data: scans } = useEventScans(id);
  const scanTicket = useScanTicket();
  const { data: promos, refetch: refetchPromos } = useEventPromotions(id);
  const createPromo = useCreateEventPromotion();
  const deletePromo = useDeleteEventPromotion();
  const { data: gallery, refetch: refetchGallery } = useEventGallery(id);
  const addGalleryItem = useAddEventGalleryItem();
  const deleteGalleryItem = useDeleteEventGalleryItem();
  const { data: partners, refetch: refetchPartners } = useEventPartners(id);
  const addPartner = useAddEventPartner();
  const removePartner = useRemoveEventPartner();
  const { data: statsData, refetch: refetchStats } = useEventStats(id);

  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [deleting, setDeleting] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState<TicketForm>({ name: '', type: 'STANDARD', price: '', quantity: '', benefits: '', saleEndAt: '' });
  const [searchParticipant, setSearchParticipant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState<PromoForm>({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', minTickets: '', startsAt: '', endsAt: '' });
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState<GalleryForm>({ url: '', type: 'IMAGE', caption: '' });
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerForm, setPartnerForm] = useState<PartnerForm>({ name: '', logoUrl: '', website: '', isSponsor: false });

  if (!params?.id) return null;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!event) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Événement introuvable</p></div>;

  const e: any = event;
  const startDate = new Date(e.startDate);
  const endDate = e.endDate ? new Date(e.endDate) : null;
  const isPast = endDate && endDate < new Date();
  const now = new Date();

  const handleDelete = async () => {
    if (!confirm('Supprimer cet événement ?')) return;
    setDeleting(true);
    try { await deleteEvent.mutateAsync(id); router.push('/dashboard/events'); } catch { setDeleting(false); }
  };

  const handleAddTicket = async () => {
    await createTicket.mutateAsync({ eventId: id, data: { ...ticketForm, price: Number(ticketForm.price), quantity: Number(ticketForm.quantity) } });
    setTicketForm({ name: '', type: 'STANDARD', price: '', quantity: '', benefits: '', saleEndAt: '' });
    setShowTicketForm(false);
  };

  const handleAddPromo = async () => {
    await createPromo.mutateAsync({ eventId: id, data: { ...promoForm, discountValue: Number(promoForm.discountValue), maxUses: Number(promoForm.maxUses), minTickets: Number(promoForm.minTickets) } });
    setPromoForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', maxUses: '', minTickets: '', startsAt: '', endsAt: '' });
    setShowPromoForm(false);
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    setScanResult(null);
    try {
      const res = await scanTicket.mutateAsync({ eventId: id, ticketRef: qrInput.trim() });
      setScanResult({ success: true, message: 'Billet valide — accès autorisé' });
    } catch (err: any) {
      setScanResult({ success: false, message: err?.response?.data?.error || err?.message || 'Billet invalide' });
    }
    setQrInput('');
  };

  const handleAddGallery = async () => {
    await addGalleryItem.mutateAsync({ eventId: id, data: galleryForm });
    setGalleryForm({ url: '', type: 'IMAGE', caption: '' });
    setShowGalleryForm(false);
  };

  const handleAddPartner = async () => {
    await addPartner.mutateAsync({ eventId: id, data: partnerForm });
    setPartnerForm({ name: '', logoUrl: '', website: '', isSponsor: false });
    setShowPartnerForm(false);
  };

  const ticketList = Array.isArray(tickets) ? tickets : [];
  const participantList = Array.isArray(participants) ? participants : [];
  const scanList = Array.isArray(scans) ? scans : [];
  const promoList = Array.isArray(promos) ? promos : [];
  const galleryList = Array.isArray(gallery) ? gallery : [];
  const partnerList = Array.isArray(partners) ? partners : [];
  const stats = statsData || {};

  const filteredParticipants = useMemo(() => {
    let f = [...participantList];
    if (searchParticipant) {
      const q = searchParticipant.toLowerCase();
      f = f.filter((p: any) => `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q));
    }
    if (filterStatus) f = f.filter((p: any) => p.status === filterStatus);
    return f;
  }, [participantList, searchParticipant, filterStatus]);

  const ticketsSold = stats?.totalTickets || ticketList.reduce((sum: number, t: any) => sum + (t.soldCount || 0), 0);
  const checkedIn = stats?.checkedIn || participantList.filter((p: any) => p.status === 'CHECKED_IN').length;
  const noShow = stats?.noShow || participantList.filter((p: any) => p.status === 'NO_SHOW').length;
  const cancelled = stats?.cancelled || participantList.filter((p: any) => p.status === 'CANCELLED' || p.status === 'REFUNDED').length;
  const totalParticipants = participantList.length;
  const revenue = stats?.revenue || ticketList.reduce((sum: number, t: any) => sum + ((t.soldCount || 0) * (t.price || 0)), 0);
  const noShowRate = totalParticipants > 0 ? ((noShow / totalParticipants) * 100).toFixed(1) : '0';
  const checkInRate = totalParticipants > 0 ? ((checkedIn / totalParticipants) * 100).toFixed(1) : '0';
  const fillRate = e.capacity > 0 ? ((ticketsSold / e.capacity) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/events" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/events/${id}/edit`}>
            <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" />{deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{e.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              {e.location && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{e.location}</div>}
              <div className="flex items-center gap-1.5"><Users className="h-4 w-4" />{e.participantCount || 0} participants</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(e.participantCount || 0) >= 50 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/30 text-white">🔥 Populaire</span>
            )}
            {(e.rating || 0) >= 4.5 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/30 text-white">⭐ Bien noté</span>
            )}
            {e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/30 text-white">🆕 Nouveau</span>
            )}
            {e.isFeatured && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-white">🏆 Vedette</span>
            )}
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
              'bg-emerald-500/30 text-white': e.status === 'PUBLISHED' || e.status === 'UPCOMING',
              'bg-blue-500/30 text-white': e.status === 'ONGOING',
              'bg-gray-500/30 text-white': isPast,
              'bg-red-500/30 text-white': e.status === 'CANCELLED',
            })}>
              {e.status === 'CANCELLED' ? 'Annulé' : isPast ? 'Terminé' : e.status === 'ONGOING' ? 'En cours' : 'Publié'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'info', label: 'Infos', icon: <CalendarDays className="h-4 w-4" /> },
          { id: 'billetterie', label: 'Billetterie', icon: <Ticket className="h-4 w-4" /> },
          { id: 'participants', label: 'Participants', icon: <Users className="h-4 w-4" /> },
          { id: 'scan', label: 'Scan & Accès', icon: <QrCode className="h-4 w-4" /> },
          { id: 'promotions', label: 'Promotions', icon: <Percent className="h-4 w-4" /> },
          { id: 'galerie', label: 'Galerie', icon: <Image className="h-4 w-4" /> },
          { id: 'partenaires', label: 'Partenaires', icon: <Handshake className="h-4 w-4" /> },
          { id: 'statistiques', label: 'Statistiques', icon: <BarChart3 className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="pills"
      />

      {/* Tab 1 — Infos */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{e.description || 'Aucune description.'}</p>
            {e.category && <div className="mt-4"><span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-50 text-brand">{e.category}</span></div>}
          </Card>

          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Capacité</span><span className="font-medium text-gray-900 dark:text-gray-100">{e.capacity || 'Illimitée'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Billets vendus</span><span className="font-medium text-gray-900 dark:text-gray-100">{e.ticketCount || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Participants</span><span className="font-medium text-gray-900 dark:text-gray-100">{e.participantCount || 0}</span></div>
                {e.price > 0 && <div className="flex justify-between"><span className="text-gray-500">Prix</span><span className="font-medium text-gray-900 dark:text-gray-100">{Number(e.price).toLocaleString()} FCFA</span></div>}
                {e.rating > 0 && <div className="flex justify-between"><span className="text-gray-500">Note</span><span className="flex items-center gap-1 font-medium text-amber-600">{e.rating.toFixed(1)} <Star className="h-3.5 w-3.5 fill-current" /></span></div>}
              </div>
            </Card>

            {endDate && (
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Période</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-gray-400" />Début : {startDate.toLocaleDateString('fr-FR')}</div>
                  <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-gray-400" />Fin : {endDate.toLocaleDateString('fr-FR')}</div>
                </div>
              </Card>
            )}
          </div>

          <Card padding="lg" className="md:col-span-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Chronologie</h3>
            <div className="space-y-3">
              {[
                { date: e.createdAt ? new Date(e.createdAt) : null, label: 'Événement créé', icon: History },
                { date: startDate, label: 'Début de l\'événement', icon: TrendingUp },
                { date: endDate, label: 'Fin de l\'événement', icon: Activity },
                { date: e.updatedAt ? new Date(e.updatedAt) : null, label: 'Dernière modification', icon: Pencil },
              ].filter(item => item.date).map((item, i, arr) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                      i === 0 ? 'bg-brand-100 dark:bg-brand-900/30 text-brand' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    {i < arr.length - 1 && <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />}
                  </div>
                  <div className="pt-1.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                    <p className="text-xs text-gray-500">
                      {item.date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2 — Billetterie */}
      {activeTab === 'billetterie' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Types de billets</h3>
            <Button size="sm" onClick={() => setShowTicketForm(!showTicketForm)}><Plus className="h-4 w-4 mr-1.5" />Ajouter un billet</Button>
          </div>

          {showTicketForm && (
            <Card padding="lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau billet</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Nom" value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} placeholder="Entrée standard" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select value={ticketForm.type} onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200">
                    <option value="STANDARD">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="VVIP">VVIP</option>
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="GROUP">Groupe</option>
                    <option value="FREE">Gratuit</option>
                  </select>
                </div>
                <Input label="Prix (FCFA)" type="number" value={ticketForm.price} onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })} />
                <Input label="Quantité" type="number" value={ticketForm.quantity} onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })} />
                <Input label="Avantages" value={ticketForm.benefits} onChange={(e) => setTicketForm({ ...ticketForm, benefits: e.target.value })} placeholder="Accès coupe-file, goodie bag" />
                <Input label="Fin de vente" type="date" value={ticketForm.saleEndAt} onChange={(e) => setTicketForm({ ...ticketForm, saleEndAt: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={handleAddTicket} isLoading={createTicket.isPending}>Créer le billet</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowTicketForm(false)}>Annuler</Button>
              </div>
            </Card>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Prix</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Vendus / Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Vente jusqu'au</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {ticketList.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun billet pour le moment</td></tr>
                  )}
                  {ticketList.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                      <td className="px-4 py-3"><Badge variant={t.type === 'VIP' || t.type === 'VVIP' ? 'purple' : t.type === 'FREE' ? 'success' : 'brand'} size="xs">{t.type}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.price > 0 ? `${Number(t.price).toLocaleString()} FCFA` : 'Gratuit'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{(t.soldCount || 0)} / {(t.quantity || '-')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.saleEndAt ? new Date(t.saleEndAt).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.isActive !== false ? 'success' : 'danger'} size="xs">{t.isActive !== false ? 'Actif' : 'Inactif'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteTicket.mutateAsync({ eventId: id, ticketId: t.id })}
                          className="text-red-500 hover:text-red-700 transition-colors p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3 — Participants */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchParticipant} onChange={(e) => setSearchParticipant(e.target.value)}
                placeholder="Rechercher un participant..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-brand focus:ring-brand/20 transition-all" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:border-brand focus:ring-brand/20 transition-all">
              <option value="">Tous les statuts</option>
              <option value="REGISTERED">Inscrit</option>
              <option value="CONFIRMED">Confirmé</option>
              <option value="CHECKED_IN">Entré</option>
              <option value="NO_SHOW">Absent</option>
              <option value="CANCELLED">Annulé</option>
              <option value="REFUNDED">Remboursé</option>
            </select>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Participant</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Téléphone</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Billet</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Prix</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Paiement</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Présence</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredParticipants.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun participant trouvé</td></tr>
                  )}
                  {filteredParticipants.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.firstName || p.name || '—'} {p.lastName || ''}</div>
                        {p.email && <div className="text-xs text-gray-400">{p.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.ticketName || p.ticket?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.price ? `${Number(p.price).toLocaleString()} FCFA` : (p.ticket?.price ? `${Number(p.ticket.price).toLocaleString()} FCFA` : '—')}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.paymentStatus === 'PAID' ? 'success' : p.paymentStatus === 'PENDING' ? 'warning' : p.paymentStatus === 'REFUNDED' ? 'info' : 'default'} size="xs">
                          {p.paymentStatus === 'PAID' ? 'Payé' : p.paymentStatus === 'PENDING' ? 'En attente' : p.paymentStatus === 'REFUNDED' ? 'Remboursé' : p.paymentStatus || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'CHECKED_IN' ? 'success' : p.status === 'REGISTERED' ? 'info' : p.status === 'CONFIRMED' ? 'brand' : p.status === 'NO_SHOW' ? 'warning' : p.status === 'REFUNDED' ? 'purple' : 'danger'} size="xs">
                          {p.status === 'CHECKED_IN' ? 'Entré' : p.status === 'REGISTERED' ? 'Inscrit' : p.status === 'CONFIRMED' ? 'Confirmé' : p.status === 'NO_SHOW' ? 'Absent' : p.status === 'CANCELLED' ? 'Annulé' : p.status === 'REFUNDED' ? 'Remboursé' : p.status || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== 'CHECKED_IN' && p.status !== 'CANCELLED' && p.status !== 'REFUNDED' && (
                            <button onClick={() => updateParticipantStatus.mutateAsync({ eventId: id, participantId: p.id, status: 'CHECKED_IN' })}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Confirmer entrée">
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== 'CANCELLED' && p.status !== 'REFUNDED' && (
                            <button onClick={() => updateParticipantStatus.mutateAsync({ eventId: id, participantId: p.id, status: 'CANCELLED' })}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Annuler billet">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {p.paymentStatus === 'PAID' && p.status !== 'REFUNDED' && (
                            <button onClick={() => updateParticipantStatus.mutateAsync({ eventId: id, participantId: p.id, status: 'REFUNDED' })}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Rembourser">
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}
                          {p.status !== 'CANCELLED' && p.status !== 'REFUNDED' && (
                            <button onClick={() => updateParticipantStatus.mutateAsync({ eventId: id, participantId: p.id, status: 'CANCELLED' })}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Blacklist">
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4 — Scan & Accès */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Scanner un billet</h3>
              <div className="flex items-center gap-3">
                <Input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Code du billet ou référence" className="flex-1" />
                <Button onClick={handleScan} isLoading={scanTicket.isPending}><QrCode className="h-4 w-4 mr-1.5" />Scanner</Button>
              </div>
              {scanResult && (
                <div className={cn('mt-4 p-3 rounded-xl text-sm font-medium', scanResult.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                  {scanResult.message}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Derniers scans</h3>
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Scanneur</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Réf. billet</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {scanList.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun scan pour le moment</td></tr>
                    )}
                    {scanList.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.scannerName || s.scannedBy || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">{s.ticketRef || s.reference || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={s.status === 'VALID' ? 'success' : s.status === 'ALREADY_USED' ? 'warning' : s.status === 'EXPIRED' ? 'default' : s.status === 'FRAUD_SUSPECTED' ? 'danger' : 'warning'} size="xs">
                            {s.status === 'VALID' ? 'Valide' : s.status === 'ALREADY_USED' ? 'Déjà utilisé' : s.status === 'EXPIRED' ? 'Expiré' : s.status === 'INVALID' ? 'Invalide' : s.status === 'FRAUD_SUSPECTED' ? 'Fraude suspectée' : s.status || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleString('fr-FR') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 5 — Promotions */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Codes promotionnels</h3>
            <Button size="sm" onClick={() => setShowPromoForm(!showPromoForm)}><Plus className="h-4 w-4 mr-1.5" />Créer une promotion</Button>
          </div>

          {showPromoForm && (
            <Card padding="lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouvelle promotion</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Code" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} placeholder="PROMO10" />
                <Input label="Description" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="10% de réduction" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de réduction</label>
                  <select value={promoForm.discountType} onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200">
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED">Montant fixe</option>
                  </select>
                </div>
                <Input label="Valeur" type="number" value={promoForm.discountValue} onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} placeholder={promoForm.discountType === 'PERCENTAGE' ? '10' : '5000'} />
                <Input label="Utilisations max" type="number" value={promoForm.maxUses} onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })} />
                <Input label="Billets min" type="number" value={promoForm.minTickets} onChange={(e) => setPromoForm({ ...promoForm, minTickets: e.target.value })} />
                <Input label="Début" type="date" value={promoForm.startsAt} onChange={(e) => setPromoForm({ ...promoForm, startsAt: e.target.value })} />
                <Input label="Fin" type="date" value={promoForm.endsAt} onChange={(e) => setPromoForm({ ...promoForm, endsAt: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={handleAddPromo} isLoading={createPromo.isPending}>Créer la promotion</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPromoForm(false)}>Annuler</Button>
              </div>
            </Card>
          )}

          {promoList.length === 0 && !showPromoForm && (
            <Card padding="lg"><p className="text-center text-gray-400">Aucune promotion créée</p></Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoList.map((p: any) => (
              <Card key={p.id} padding="md" className="relative">
                <button onClick={() => deletePromo.mutateAsync({ eventId: id, promoId: p.id })}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand text-lg">{p.code}</span>
                    <Badge variant={p.isActive !== false ? 'success' : 'danger'} size="xs">{p.isActive !== false ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="brand" size="xs">{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `${Number(p.discountValue).toLocaleString()} FCFA`}</Badge>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Utilisations : {p.currentUses || 0}{p.maxUses ? ` / ${p.maxUses}` : ''}</p>
                    {p.minTickets > 0 && <p>Billets min : {p.minTickets}</p>}
                    {p.startsAt && <p>Du {new Date(p.startsAt).toLocaleDateString('fr-FR')}</p>}
                    {p.endsAt && <p>Au {new Date(p.endsAt).toLocaleDateString('fr-FR')}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6 — Galerie */}
      {activeTab === 'galerie' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Galerie média</h3>
            <Button size="sm" onClick={() => setShowGalleryForm(!showGalleryForm)}><Plus className="h-4 w-4 mr-1.5" />Ajouter un média</Button>
          </div>

          {showGalleryForm && (
            <Card padding="lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau média</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="URL" value={galleryForm.url} onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })} placeholder="https://..." className="sm:col-span-2" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select value={galleryForm.type} onChange={(e) => setGalleryForm({ ...galleryForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200">
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Vidéo</option>
                  </select>
                </div>
                <Input label="Légende" value={galleryForm.caption} onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })} placeholder="Description" className="sm:col-span-3" />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={handleAddGallery} isLoading={addGalleryItem.isPending}>Ajouter</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowGalleryForm(false)}>Annuler</Button>
              </div>
            </Card>
          )}

          {galleryList.length === 0 && !showGalleryForm && (
            <Card padding="lg"><p className="text-center text-gray-400">Aucun média dans la galerie</p></Card>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryList.map((item: any) => (
              <Card key={item.id} padding="none" className="relative group overflow-hidden">
                {item.type === 'VIDEO' ? (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <video src={item.url} controls className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                    {item.url ? (
                      <NextImage src={item.url} alt={item.caption || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400"><Image className="h-8 w-8" /></div>
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => deleteGalleryItem.mutateAsync({ eventId: id, itemId: item.id })}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">{item.caption}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7 — Partenaires */}
      {activeTab === 'partenaires' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Partenaires</h3>
            <Button size="sm" onClick={() => setShowPartnerForm(!showPartnerForm)}><Plus className="h-4 w-4 mr-1.5" />Ajouter un partenaire</Button>
          </div>

          {showPartnerForm && (
            <Card padding="lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau partenaire</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nom" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} placeholder="Nom du partenaire" />
                <Input label="URL du logo" value={partnerForm.logoUrl} onChange={(e) => setPartnerForm({ ...partnerForm, logoUrl: e.target.value })} placeholder="https://..." />
                <Input label="Site web" value={partnerForm.website} onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })} placeholder="https://..." />
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={partnerForm.isSponsor} onChange={(e) => setPartnerForm({ ...partnerForm, isSponsor: e.target.checked })}
                      className="rounded border-gray-300 text-brand focus:ring-brand" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sponsor officiel</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" onClick={handleAddPartner} isLoading={addPartner.isPending}>Ajouter</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPartnerForm(false)}>Annuler</Button>
              </div>
            </Card>
          )}

          {partnerList.length === 0 && !showPartnerForm && (
            <Card padding="lg"><p className="text-center text-gray-400">Aucun partenaire associé</p></Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerList.map((p: any) => (
              <Card key={p.id} padding="md" className="relative flex items-center gap-4">
                <button onClick={() => removePartner.mutateAsync({ eventId: id, partnerId: p.id })}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {p.logoUrl ? (
                    <NextImage src={p.logoUrl} alt={p.name} fill className="object-contain" sizes="56px" unoptimized />
                  ) : (
                    <Handshake className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline truncate block">{p.website}</a>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {p.isSponsor && <Badge variant="brand" size="xs">Sponsor</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8 — Statistiques */}
      {activeTab === 'statistiques' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Participants" value={totalParticipants} />
            <StatsCard icon={<Check className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Entrés (check-in)" value={checkedIn} />
            <StatsCard icon={<X className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Absents (no-show)" value={noShow} />
            <StatsCard icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-600" label="Annulés" value={cancelled} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard icon={<Activity className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Taux d'absence" value={`${noShowRate}%`} />
            <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Taux de check-in" value={`${checkInRate}%`} />
            <StatsCard icon={<BarChart3 className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" label="Taux de remplissage" value={`${fillRate}%`} />
            <StatsCard icon={<DollarSign className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Revenu total" value={`${Number(revenue).toLocaleString()} FCFA`} />
          </div>

          {ticketList.length > 0 && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ventes par billet</h3>
              <div className="space-y-3">
                {ticketList.map((t: any) => {
                  const sold = t.soldCount || 0;
                  const qty = t.quantity || 0;
                  const pct = qty > 0 ? Math.round((sold / qty) * 100) : 0;
                  return (
                    <div key={t.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{t.name}</span>
                        <span className="text-gray-500">{sold}{qty > 0 ? ` / ${qty}` : ''} vendus{pct > 0 ? ` (${pct}%)` : ''}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand' : 'bg-amber-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
