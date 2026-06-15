'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, User, Phone, Mail, Calendar, CheckCircle2, XCircle, Send, Loader, Clock, FileSignature } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useQuote, useUpdateQuoteStatus, useConvertQuoteToInvoice } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'default', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Envoyé', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  VIEWED: { label: 'Consulté', variant: 'info', color: 'bg-indigo-100 text-indigo-700' },
  ACCEPTED: { label: 'Accepté', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Refusé', variant: 'danger', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Expiré', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  CONVERTED: { label: 'Converti', variant: 'success', color: 'bg-teal-100 text-teal-700' },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: quoteData, isLoading, refetch } = useQuote(id);
  const updateStatus = useUpdateQuoteStatus();
  const convertToInvoice = useConvertQuoteToInvoice();

  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);

  const quote = quoteData?.quote || quoteData?.data || quoteData;
  const s = STATUS_CONFIG[quote?.status] || STATUS_CONFIG.DRAFT;

  const handleStatusUpdate = async (status: string) => {
    setUpdating(true);
    try { await updateStatus.mutateAsync({ id, status }); refetch(); } catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      const res = await convertToInvoice.mutateAsync(id);
      const invoiceId = (res as any)?.data?.data?.id || (res as any)?.data?.id;
      if (invoiceId) router.push(`/dashboard/finance/invoices/${invoiceId}`);
      else refetch();
    } catch (err) { console.error(err); } finally { setConverting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!quote) return <div className="text-center py-12 text-gray-500">Devis introuvable</div>;

  const items = quote.quoteItems || [];
  const isDraft = quote.status === 'DRAFT';
  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date() && !['ACCEPTED', 'REJECTED', 'CONVERTED'].includes(quote.status);

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/quotes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quote.quoteNumber || `#${id.slice(0, 8)}`}</h1>
            <Badge variant={isExpired ? 'warning' : s.variant} size="sm">{isExpired ? 'Expiré' : s.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (<><button onClick={() => handleStatusUpdate('SENT')} disabled={updating}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <Send className="w-4 h-4" />Marquer envoyé</button>
            <button onClick={handleConvert} disabled={converting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              {converting ? <Loader className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}Convertir en facture</button></>)}
          {quote.status === 'SENT' && (<><button onClick={() => handleStatusUpdate('ACCEPTED')} disabled={updating}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />Accepter</button>
            <button onClick={() => handleStatusUpdate('REJECTED')} disabled={updating}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />Refuser</button>
            <button onClick={handleConvert} disabled={converting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
              {converting ? <Loader className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}Convertir en facture</button></>)}
          {quote.status === 'ACCEPTED' && (<button onClick={handleConvert} disabled={converting}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5">
            {converting ? <Loader className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}Générer la facture</button>)}
          {quote.invoice && (<Link href={`/dashboard/finance/invoices/${quote.invoice.id}`}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand/90 flex items-center gap-1.5">
            <FileSignature className="w-4 h-4" />Voir la facture liée</Link>)}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Articles</h3>
          {items.length === 0 ? <p className="text-xs text-gray-400">Aucun article</p> : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {items.map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(Number(item.total || item.unitPrice * item.quantity))}</p>
                    <p className="text-[10px] text-gray-400">{item.quantity} × {formatPrice(Number(item.unitPrice))}</p></div>
                </div>
              ))}
              {/* Totals */}
              <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Sous-total</span><span>{formatPrice(Number(quote.subtotal || 0))}</span></div>
                {Number(quote.taxAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Taxe</span><span>{formatPrice(Number(quote.taxAmount))}</span></div>}
                {Number(quote.discountAmount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Remise</span><span className="text-red-500">-{formatPrice(Number(quote.discountAmount))}</span></div>}
                <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white mt-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span><span>{formatPrice(Number(quote.totalAmount || 0))}</span></div>
              </div>
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><User className="w-4 h-4" />Client</h3>
            <div className="space-y-2 text-sm">
              {quote.clientName && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><User className="w-4 h-4 shrink-0" />{quote.clientName}</div>}
              {quote.clientPhone && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Phone className="w-4 h-4 shrink-0" />{quote.clientPhone}</div>}
              {quote.clientEmail && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4 shrink-0" />{quote.clientEmail}</div>}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Statut</span><span className={cn('font-medium', s.color)}>{isExpired ? 'Expiré' : s.label}</span></div>
              <div className="flex justify-between"><span>Date d'expiration</span><span className="font-medium text-gray-700 dark:text-gray-300">{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : '—'}</span></div>
              <div className="flex justify-between"><span>Devise</span><span className="font-medium text-gray-700 dark:text-gray-300">{quote.currency || 'FCFA'}</span></div>
              {quote.terms && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><span>Conditions:</span><p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{quote.terms}</p></div>}
              {quote.notes && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><span>Notes:</span><p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{quote.notes}</p></div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
