'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, User, Phone, Loader, CheckCircle2, FileText, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useDebt, useUpdateDebt } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'danger' | 'success' | 'info' | 'default'; color: string }> = {
  ACTIVE: { label: 'Active', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  PARTIALLY_PAID: { label: 'Partielle', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  SETTLED: { label: 'Réglée', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  OVERDUE: { label: 'En retard', variant: 'danger', color: 'bg-red-100 text-red-700' },
  CRITICAL: { label: 'Critique', variant: 'danger', color: 'bg-rose-100 text-rose-700' },
  DISPUTE: { label: 'Litige', variant: 'danger', color: 'bg-purple-100 text-purple-700' },
  CANCELLED: { label: 'Annulée', variant: 'default', color: 'bg-gray-100 text-gray-600' },
};

export default function DebtDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: debtData, isLoading, refetch } = useDebt(id);
  const updateDebt = useUpdateDebt();

  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [settling, setSettling] = useState(false);

  const debt = debtData?.debt || debtData?.data || debtData;
  const s = STATUS_CONFIG[debt?.status] || STATUS_CONFIG.ACTIVE;
  const buyer = debt?.buyer || {};
  const remaining = Number(debt?.remainingAmount || debt?.totalAmount || 0);
  const total = Number(debt?.totalAmount || 0);
  const paid = total - remaining;
  const progress = total > 0 ? (paid / total * 100) : 0;
  const isOverdue = debt?.dueDate && new Date(debt.dueDate) < new Date() && debt?.status !== 'SETTLED';

  const handlePayment = async () => {
    if (payAmount <= 0) return;
    setPaying(true);
    try {
      await apiClient.registerDebtPayment(id, { amount: payAmount });
      refetch();
      setPayModal(false);
      setPayAmount(0);
    } catch (err) { console.error(err); } finally { setPaying(false); }
  };

  const handleSettle = async () => {
    setSettling(true);
    try {
      await updateDebt.mutateAsync({ id, data: { status: 'SETTLED' } });
      refetch();
    } catch (err) { console.error(err); } finally { setSettling(false); }
  };

  const handleRemind = async () => {
    setReminding(true);
    try {
      await apiClient.sendDebtReminder(id);
      refetch();
    } catch (err) { console.error(err); } finally { setReminding(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!debt) return <div className="text-center py-12 text-gray-500">Dette non trouvée</div>;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/debts" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dette #{id.slice(0, 8)}</h1>
            <Badge variant={isOverdue ? 'danger' : s.variant} size="sm">{isOverdue ? 'En retard' : s.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">Créée le {new Date(debt.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Actions */}
      {debt.status !== 'SETTLED' && debt.status !== 'CANCELLED' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setPayModal(true); setPayAmount(Math.min(remaining, remaining)); }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand/90 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />Enregistrer paiement
            </button>
            <button onClick={handleSettle} disabled={settling}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />{settling ? '...' : 'Marquer soldée'}
            </button>
            <button onClick={handleRemind} disabled={reminding}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 flex items-center gap-1.5">
              <Send className="w-4 h-4" />{reminding ? '...' : 'Envoyer rappel'}
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" />Paiement</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Progression</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(paid)} / {formatPrice(total)}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-emerald-500' : 'bg-brand')}
                  style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20"><p className="text-[10px] text-amber-600 uppercase font-semibold">Reste dû</p><p className="text-lg font-bold text-amber-700">{formatPrice(remaining)}</p></div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20"><p className="text-[10px] text-emerald-600 uppercase font-semibold">Payé</p><p className="text-lg font-bold text-emerald-700">{formatPrice(paid)}</p></div>
            </div>
          </Card>

          {/* Reminders History */}
          {debt.reminders?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Send className="w-4 h-4" />Historique des rappels</h3>
              <div className="space-y-2">
                {debt.reminders.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">Rappel {r.type === 'OVERDUE' ? 'retard' : 'échéance'}</p>
                      <p className="text-[10px] text-gray-400">Via {r.channel} • {r.sentAt ? new Date(r.sentAt).toLocaleString('fr-FR') : '—'}</p>
                    </div>
                    <Badge variant={r.status === 'SENT' ? 'success' : 'warning'} size="xs">{r.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><User className="w-4 h-4" />Client</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><User className="w-4 h-4 shrink-0" />{buyer.firstName || buyer.lastName ? `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() : 'Client'}</div>
              {buyer.phone && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Phone className="w-4 h-4 shrink-0" />{buyer.phone}</div>}
              {buyer.email && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">{buyer.email}</div>}
            </div>
          </Card>

          {/* Details */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Statut</span><span className={cn('font-medium', s.color)}>{isOverdue ? 'En retard' : s.label}</span></div>
              <div className="flex justify-between"><span>Priorité</span><span className="font-medium text-gray-700 dark:text-gray-300">{debt.priority || '—'}</span></div>
              <div className="flex justify-between"><span>Niveau risque</span><span className="font-medium text-gray-700 dark:text-gray-300">{debt.riskLevel || '—'}</span></div>
              {debt.dueDate && <div className="flex justify-between"><span>Échéance</span><span className={cn('font-medium', isOverdue ? 'text-red-600' : 'text-gray-700 dark:text-gray-300')}>{new Date(debt.dueDate).toLocaleDateString('fr-FR')}</span></div>}
              {debt.sourceType && <div className="flex justify-between"><span>Source</span><span className="font-medium text-gray-700 dark:text-gray-300">{debt.sourceType}</span></div>}
              {debt.notes && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><span>Notes:</span><p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{debt.notes}</p></div>}
            </div>
          </Card>

          {/* Related */}
          {(debt.order || debt.invoice) && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Transaction liée</h3>
              <div className="space-y-2">
                {debt.order && <Link href={`/dashboard/orders/${debt.order.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-brand font-medium">
                  <FileText className="w-3.5 h-3.5" />Commande {debt.order.orderNumber}
                </Link>}
                {debt.invoice && <Link href={`/dashboard/finance/invoices/${debt.invoice.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-brand font-medium">
                  <FileText className="w-3.5 h-3.5" />Facture {debt.invoice.invoiceNumber}
                </Link>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPayModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Enregistrer un paiement</h3>
            <p className="text-sm text-gray-500 mb-4">Reste dû: <strong>{formatPrice(remaining)}</strong></p>
            <input type="number" value={payAmount || ''} onChange={(e) => setPayAmount(Math.min(Number(e.target.value) || 0, remaining))}
              placeholder="Montant" max={remaining}
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-transparent dark:text-gray-100" />
            <div className="flex gap-2">
              <button onClick={() => setPayModal(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400">Annuler</button>
              <button onClick={handlePayment} disabled={payAmount <= 0 || paying}
                className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium disabled:opacity-50">
                {paying ? <Loader className="h-4 w-4 animate-spin mx-auto" /> : `Payer ${formatPrice(payAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
