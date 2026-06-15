'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, MapPin, Calendar, Mail, ShoppingBag,
  Tag, Layers, MessageCircle, Plus, X, Clock, CreditCard,
  AlertTriangle, Award, Star, FileText, Send, Trash2, Edit3,
  ChevronRight, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import {
  useCrmClientDetail,
  useCrmTags,
  useCrmSegments,
  useCrmCreateTag,
  useCrmAssignTag,
  useCrmRemoveTag,
  useCrmAssignClientToSegment,
  useCrmRemoveClientFromSegment,
  useCrmAddClientNote,
  useCrmDeleteClientNote,
} from '@/features/crm/hooks';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PREPARING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  READY: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  DELIVERING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DISPUTE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SETTLED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: client, isLoading, error } = useCrmClientDetail(clientId);
  const { data: tags } = useCrmTags();
  const { data: segments } = useCrmSegments();
  const assignTag = useCrmAssignTag();
  const removeTag = useCrmRemoveTag();
  const createTag = useCrmCreateTag();
  const assignSegment = useCrmAssignClientToSegment();
  const removeSegment = useCrmRemoveClientFromSegment();
  const addNote = useCrmAddClientNote();
  const deleteNote = useCrmDeleteClientNote();

  const [noteText, setNoteText] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  async function handleAddNote() {
    if (!noteText.trim()) return;
    await addNote.mutateAsync({ clientId, content: noteText.trim() });
    setNoteText('');
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const tag = await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
    await assignTag.mutateAsync({ clientId, tagId: tag.id });
    setNewTagName('');
    setShowNewTag(false);
  }

  if (isLoading) return <Loader variant="spinner" size="lg" fullScreen />;
  if (error) return <ErrorState title="Erreur" message="Impossible de charger le client" onRetry={() => router.refresh()} />;
  if (!client) return <ErrorState title="Client non trouvé" message="Ce client n'existe pas" />;

  const bc = client;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/clients')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bc.client?.fullName || `${bc.firstName || ''} ${bc.lastName || ''}`.trim()}</h1>
          <p className="text-sm text-gray-500">Fiche client CRM</p>
        </div>
        <div className="ml-auto">
          <Link
            href={`/dashboard/clients/${clientId}/360`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 border border-brand/20 rounded-xl transition-colors"
          >
            Vue 360°
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile + tags + segments */}
        <div className="space-y-4">
          {/* Profile card */}
          <Card>
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3">
                {`${(bc.firstName || bc.client?.firstName || '')?.charAt(0)}${(bc.lastName || bc.client?.lastName || '')?.charAt(0)}`.toUpperCase() || '?'}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{bc.client?.fullName || `${bc.firstName || bc.client?.firstName} ${bc.lastName || bc.client?.lastName}`}</h2>
              <p className="text-sm text-gray-500">{bc.email || bc.client?.email}</p>
            </div>
            <div className="space-y-3">
              {(bc.phone || bc.client?.phone) && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{bc.phone || bc.client?.phone}</span>
                </div>
              )}
              {(bc.email || bc.client?.email) && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{bc.email || bc.client?.email}</span>
                </div>
              )}
              {(bc.city || bc.client?.city) && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{bc.city || bc.client?.city}{bc.client?.neighborhood ? `, ${bc.client.neighborhood}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Client depuis {new Date(bc.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {bc.client?.birthDate && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Star className="h-4 w-4 shrink-0" />
                  <span>Né(e) le {new Date(bc.client.birthDate).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {bc.tags?.length > 0 ? bc.tags.map((t: any) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: t.color + '20', color: t.color }}
                >
                  {t.name}
                  <button onClick={() => removeTag.mutate({ clientId, tagId: t.id })} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )) : (
                <p className="text-xs text-gray-400">Aucun tag</p>
              )}
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => { if (e.target.value) { assignTag.mutate({ clientId, tagId: e.target.value }); e.target.value = ''; } }}
                value=""
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="">+ Ajouter un tag</option>
                {tags?.filter((t: any) => !bc.tags?.some((ct: any) => ct.id === t.id)).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} ({t._count?.clients || 0})</option>
                ))}
              </select>
              <button onClick={() => setShowNewTag(!showNewTag)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showNewTag && (
              <div className="flex gap-2 mt-2">
                <input type="text" placeholder="Nouveau tag..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()} />
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <button onClick={handleCreateTag} className="px-2 py-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90">OK</button>
              </div>
            )}
          </Card>

          {/* Segments */}
          <Card title="Segments">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {bc.segments?.length > 0 ? bc.segments.map((s: any) => (
                <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: s.color + '20', color: s.color }}>
                  {s.name}
                  <button onClick={() => removeSegment.mutate({ clientId, segmentId: s.id })} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )) : (
                <p className="text-xs text-gray-400">Aucun segment</p>
              )}
            </div>
            <select
              onChange={(e) => { if (e.target.value) { assignSegment.mutate({ clientId, segmentId: e.target.value }); e.target.value = ''; } }}
              value=""
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="">+ Ajouter au segment</option>
              {segments?.filter((s: any) => !bc.segments?.some((cs: any) => cs.id === s.id)).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Card>

          {/* Risk */}
          {bc.clientRisk && (
            <Card title="Évaluation risque">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Niveau</span>
                  <span className={cn(
                    'text-sm font-semibold px-2 py-0.5 rounded-full',
                    bc.clientRisk.riskLevel === 'LOW' && 'text-green-600 bg-green-50 dark:bg-green-900/20',
                    bc.clientRisk.riskLevel === 'MEDIUM' && 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
                    bc.clientRisk.riskLevel === 'HIGH' && 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
                    bc.clientRisk.riskLevel === 'CRITICAL' && 'text-red-600 bg-red-50 dark:bg-red-900/20',
                  )}>
                    {bc.clientRisk.riskLevel === 'LOW' ? 'Faible' : bc.clientRisk.riskLevel === 'MEDIUM' ? 'Moyen' : bc.clientRisk.riskLevel === 'HIGH' ? 'Élevé' : 'Critique'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Fiabilité</span>
                  <span className="text-sm font-semibold">{bc.clientRisk.reliabilityScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Retards</span>
                  <span className="text-sm font-semibold">{bc.clientRisk.latePaymentCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Litiges</span>
                  <span className="text-sm font-semibold">{bc.clientRisk.disputeCount}</span>
                </div>
                {bc.clientRisk.blacklisted && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" /> Client blacklisté
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Loyalty */}
          {bc.loyalty && (
            <Card title="Fidélité">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className={cn(
                    'h-5 w-5',
                    bc.loyalty.tier === 'DIAMOND' && 'text-cyan-500',
                    bc.loyalty.tier === 'PLATINUM' && 'text-gray-400',
                    bc.loyalty.tier === 'GOLD' && 'text-amber-500',
                    bc.loyalty.tier === 'SILVER' && 'text-gray-400',
                    bc.loyalty.tier === 'BRONZE' && 'text-orange-700',
                  )} />
                  <span className="text-sm font-semibold">{bc.loyalty.tier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Points</span>
                  <span className="text-sm font-semibold">{bc.loyalty.totalPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Cumul</span>
                  <span className="text-sm font-semibold">{bc.loyalty.lifetimePoints}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Middle + Right: orders, debts, notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bc.totalOrders}</p>
              <p className="text-xs text-gray-500">Commandes</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-2xl font-bold text-brand">{Number(bc.totalSpent).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Dépensé (FCFA)</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bc.visitCount || 0}</p>
              <p className="text-xs text-gray-500">Visites</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bc.orders?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Dernières commandes</p>
            </div>
          </div>

          {/* Orders */}
          <Card title="Commandes récentes" titleIcon={<ShoppingBag className="h-4 w-4" />}>
            {bc.orders?.length > 0 ? (
              <div className="space-y-2">
                {bc.orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(order.totalAmount).toLocaleString()} FCFA</p>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-0.5',
                        statusColors[order.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune commande</p>
            )}
          </Card>

          {/* Bookings */}
          {bc.bookings?.length > 0 && (
            <Card title="Réservations récentes" titleIcon={<Calendar className="h-4 w-4" />}>
              <div className="space-y-2">
                {bc.bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.type}</p>
                      <p className="text-xs text-gray-500">{new Date(booking.startDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(booking.price).toLocaleString()} FCFA</p>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-0.5',
                        statusColors[booking.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Debts */}
          {bc.debts?.length > 0 && (
            <Card title="Dettes en cours" titleIcon={<CreditCard className="h-4 w-4" />}>
              <div className="space-y-2">
                {bc.debts.map((debt: any) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{Number(debt.totalAmount).toLocaleString()} FCFA</p>
                      <p className="text-xs text-gray-500">Restant: {Number(debt.remainingAmount).toLocaleString()} FCFA</p>
                    </div>
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                      statusColors[debt.status] || 'bg-gray-100 text-gray-600'
                    )}>
                      {debt.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card title="Notes internes" titleIcon={<FileText className="h-4 w-4" />}>
            <div className="space-y-3 mb-4">
              {bc.notes?.length > 0 ? bc.notes.map((note: any) => (
                <div key={note.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">{note.content}</p>
                    <button
                      onClick={() => deleteNote.mutate(note.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    {note.createdBy && <span className="text-[10px] text-gray-400">• par {note.createdBy}</span>}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400">Aucune note</p>
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                placeholder="Ajouter une note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                rows={2}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
              />
              <Button onClick={handleAddNote} size="sm" disabled={!noteText.trim() || addNote.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
