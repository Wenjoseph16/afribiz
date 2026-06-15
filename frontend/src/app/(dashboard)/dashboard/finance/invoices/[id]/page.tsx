'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSignature, User, Phone, Mail, DollarSign, CheckCircle2, Loader, Clock, Send, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useInvoice, useUpdateInvoiceStatus, useUpdateInvoicePayment } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'default', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Envoyée', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  PARTIALLY_PAID: { label: 'Partielle', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Payée', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  OVERDUE: { label: 'En retard', variant: 'danger', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700' },
  DISPUTE: { label: 'Litige', variant: 'danger', color: 'bg-rose-100 text-rose-700' },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: invoiceData, isLoading, refetch } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const updatePayment = useUpdateInvoicePayment();

  const [updating, setUpdating] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [paying, setPaying] = useState(false);

  const invoice = invoiceData?.invoice || invoiceData?.data || invoiceData;
  const s = STATUS_CONFIG[invoice?.status] || STATUS_CONFIG.DRAFT;
  const items = invoice?.invoiceItems || [];
  const remaining = Number(invoice?.totalAmount || 0) - Number(invoice?.amountPaid || 0);
  const isOverdue = invoice?.dueDate && new Date(invoice.dueDate) < new Date() && invoice?.status !== 'PAID';

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try { await updateStatus.mutateAsync({ id, status }); refetch(); } catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  const handlePayment = async () => {
    if (payAmount <= 0) return;
    setPaying(true);
    try {
      await updatePayment.mutateAsync({ id, data: { amount: payAmount } });
      refetch();
      setPayModal(false);
      setPayAmount(0);
    } catch (err) { console.error(err); } finally { setPaying(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500">Facture introuvable</div>;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/invoices" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber || `#${id.slice(0, 8)}`}</h1>
            <Badge variant={isOverdue ? 'danger' : s.variant} size="sm">{isOverdue ? 'En retard' : s.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">Créée le {new Date(invoice.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'DRAFT' && <button onClick={() => handleStatusUpdate('SENT')} disabled={updating}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
            <Send className="w-4 h-4" />Marquer envoyée</button>}
          {invoice.status === 'SENT' && <button onClick={() => handleStatusUpdate('PAID')} disabled={updating}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />Marquer payée</button>}
          {remaining > 0 && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button onClick={() => { setPayModal(true); setPayAmount(Math.min(remaining, remaining)); }}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />Enregistrer un paiement</button>)}
          {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
            <button onClick={() => handleStatusUpdate('CANCELLED')} disabled={updating}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
              Annuler</button>)}
          {invoice.quote && <Link href={`/dashboard/finance/quotes/${invoice.quote.id}`}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand/90 flex items-center gap-1.5">
            Voir le devis lié</Link>}
          <button onClick={() => {
            const token = localStorage.getItem('accessToken');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const url = baseUrl + '/business/finance/invoices/' + id + '/pdf';
            fetch(url, { headers: { Authorization: 'Bearer ' + token } })
              .then(r => r.blob())
              .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'facture_' + (invoice?.invoiceNumber || id) + '.pdf';
                a.click();
              })
              .catch(() => {});
          }}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5 transition-colors">
            <Download className="w-4 h-4" />Télécharger PDF</button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FileSignature className="w-4 h-4" />Articles</h3>
          {items.length === 0 ? <p className="text-xs text-gray-400">Aucun article</p> : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {items.map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(Number(item.total || item.unitPrice * item.quantity))}</p>
                    <p className="text-[10px] text-gray-400">{item.quantity} × {formatPrice(Number(item.unitPrice))}</p></div>
                </div>
              ))}
              <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Sous-total</span><span>{formatPrice(Number(invoice.subtotal || 0))}</span></div>
                {Number(invoice.taxAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Taxe</span><span>{formatPrice(Number(invoice.taxAmount))}</span></div>}
                {Number(invoice.discountAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Remise</span><span className="text-red-500">-{formatPrice(Number(invoice.discountAmount))}</span></div>}
                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatPrice(Number(invoice.totalAmount || 0))}</span>
                </div>
                {Number(invoice.amountPaid || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Payé</span><span className="text-emerald-600 font-medium">{formatPrice(Number(invoice.amountPaid))}</span></div>}
                {remaining > 0 && <div className="flex justify-between text-sm"><span className="text-amber-600">Reste dû</span><span className="text-amber-600 font-bold">{formatPrice(remaining)}</span></div>}
              </div>
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><User className="w-4 h-4" />Client</h3>
            <div className="space-y-2 text-sm">
              {invoice.clientName && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><User className="w-4 h-4 shrink-0" />{invoice.clientName}</div>}
              {invoice.clientPhone && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Phone className="w-4 h-4 shrink-0" />{invoice.clientPhone}</div>}
              {invoice.clientEmail && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4 shrink-0" />{invoice.clientEmail}</div>}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Paiement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(Number(invoice.totalAmount || 0))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payé</span><span className="font-medium text-emerald-600">{formatPrice(Number(invoice.amountPaid || 0))}</span></div>
              {remaining > 0 && <div className="flex justify-between"><span className="text-gray-500">Reste</span><span className="font-bold text-amber-600">{formatPrice(remaining)}</span></div>}
              {invoice.paidAt && <div className="flex justify-between text-xs"><span className="text-gray-500">Payée le</span><span>{new Date(invoice.paidAt).toLocaleDateString('fr-FR')}</span></div>}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Statut</span><span className={cn('font-medium', s.color)}>{isOverdue ? 'En retard' : s.label}</span></div>
              {invoice.dueDate && <div className="flex justify-between"><span>Échéance</span><span className={cn('font-medium', isOverdue ? 'text-red-600' : 'text-gray-700 dark:text-gray-300')}>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span></div>}
              <div className="flex justify-between"><span>Devise</span><span className="font-medium text-gray-700 dark:text-gray-300">{invoice.currency || 'FCFA'}</span></div>
              {invoice.notes && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><span>Notes:</span><p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{invoice.notes}</p></div>}
            </div>
          </Card>
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
                {paying ? <Loader className="h-4 w-4 animate-spin mx-auto" /> : `Payer ${formatPrice(payAmount)}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
