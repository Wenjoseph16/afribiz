'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Trash2, Save, ArrowLeft, Calculator,
  FileText, Send, Edit3, FileSignature, AlertTriangle,
  Clock, CheckCircle, XCircle, ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuote, useUpdateQuoteStatus, useConvertQuoteToInvoice, useDeleteQuote } from '@/features/hooks';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  SENT: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ACCEPTED: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: 'Expiré', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONVERTED: { label: 'Converti', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: quote, isLoading, error, refetch } = useQuote(id);
  const updateStatus = useUpdateQuoteStatus();
  const convertToInvoice = useConvertQuoteToInvoice();
  const deleteQuote = useDeleteQuote();

  const handleSend = () => {
    updateStatus.mutate({ id, status: 'SENT' });
  };

  const handleConvert = () => {
    convertToInvoice.mutate(id, {
      onSuccess: () => refetch(),
    });
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      deleteQuote.mutate(id, {
        onSuccess: () => router.push('/dashboard/quotes'),
      });
    }
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (error || !quote) {
    return (
      <ErrorState
        title="Devis introuvable"
        message="Impossible de charger les détails de ce devis."
        onRetry={refetch}
      />
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
  const items: Array<{ description: string; quantity: number; unitPrice: number }> =
    quote.items || [];
  const subtotal = items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0);
  const totalAmount = quote.totalAmount ?? (subtotal + Number(quote.taxAmount || 0) - Number(quote.discountAmount || 0));

  let actions: React.ReactNode = null;

  if (quote.status === 'DRAFT') {
    actions = (
      <>
        <Button onClick={handleSend} isLoading={updateStatus.isPending}>
          <Send className="h-4 w-4 mr-1.5" />Envoyer
        </Button>
        <Link href={`/dashboard/quotes/${id}/edit`}>
          <Button variant="secondary">
            <Edit3 className="h-4 w-4 mr-1.5" />Modifier
          </Button>
        </Link>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteQuote.isPending}>
          <Trash2 className="h-4 w-4 mr-1.5" />Supprimer
        </Button>
      </>
    );
  } else if (quote.status === 'SENT') {
    actions = (
      <Button onClick={handleConvert} isLoading={convertToInvoice.isPending}>
        <FileSignature className="h-4 w-4 mr-1.5" />Convertir en facture
      </Button>
    );
  } else if (quote.status === 'ACCEPTED') {
    actions = (
      <Button onClick={handleConvert} isLoading={convertToInvoice.isPending}>
        <FileSignature className="h-4 w-4 mr-1.5" />Convertir en facture
      </Button>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={quote.title || 'Devis'}
        description={quote.number ? `Réf: ${quote.number}` : undefined}
        breadcrumbs={[
          { label: 'Devis', href: '/dashboard/quotes' },
          { label: quote.title || 'Détail' },
        ]}
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/quotes">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-1.5" />Retour
              </Button>
            </Link>
            {actions}
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-700 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-brand-100 text-sm mb-1">Statut</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold">{totalAmount.toLocaleString()} FCFA</p>
              <p className="text-brand-100 text-sm">Montant total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Articles</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-center">Qté</th>
                    <th className="pb-3 font-medium text-right">Prix unitaire</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-900 dark:text-gray-100">{item.description}</td>
                      <td className="py-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-400">{Number(item.unitPrice).toLocaleString()} FCFA</td>
                      <td className="py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {(item.quantity * item.unitPrice).toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {quote.convertedInvoiceId && (
            <Card variant="elevated" className="border-brand/30 dark:border-brand/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <FileSignature className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Converti en facture</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ce devis a été converti en facture
                  </p>
                </div>
                <Link href={`/dashboard/invoices/${quote.convertedInvoiceId}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1.5" />Voir la facture
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {quote.notes && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{quote.notes}</p>
            </Card>
          )}

          {quote.terms && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Conditions générales</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{quote.terms}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Client</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nom</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{quote.clientName}</p>
              </div>
              {quote.clientEmail && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{quote.clientEmail}</p>
                </div>
              )}
              {quote.clientPhone && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{quote.clientPhone}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Résumé financier</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{subtotal.toLocaleString()} FCFA</span>
              </div>
              {Number(quote.taxAmount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Taxe</span>
                  <span className="text-gray-900 dark:text-gray-100">{Number(quote.taxAmount).toLocaleString()} FCFA</span>
                </div>
              )}
              {Number(quote.discountAmount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Remise</span>
                  <span className="text-red-500">-{Number(quote.discountAmount).toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-brand">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </Card>

          {(quote.validUntil || quote.currency) && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations</h3>
              <div className="space-y-3">
                {quote.validUntil && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valable jusqu'au</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {quote.currency && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Devise</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{quote.currency}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
