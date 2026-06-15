'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import {
  Wallet, CheckCircle, Clock, XCircle, Shield,
  Smartphone, Building, CreditCard, Banknote,
  PlusCircle, FileText, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Espèces', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'BANK_TRANSFER', label: 'Virement', icon: Building, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  { id: 'CREDIT_CARD', label: 'Carte bancaire', icon: CreditCard, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
  { id: 'ESCROW', label: 'Escrow sécurisé', icon: Shield, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: any }> = {
  COMPLETED: { label: 'Payé', variant: 'success', icon: CheckCircle },
  VERIFYING: { label: 'En vérification', variant: 'warning', icon: Clock },
  PENDING: { label: 'En attente', variant: 'warning', icon: Clock },
  FAILED: { label: 'Échoué', variant: 'danger', icon: XCircle },
  REFUNDED: { label: 'Remboursé', variant: 'info', icon: ArrowRight },
  EXPIRED: { label: 'Expiré', variant: 'default', icon: XCircle },
};

export interface HybridPaymentSectionProps {
  orderId: string;
  orderTotal?: number;
}

export function HybridPaymentSection({ orderId, orderTotal }: HybridPaymentSectionProps) {
  const qc = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState<string>('CASH');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isManual, setIsManual] = useState<boolean>(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['hybrid-payments', orderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${orderId}/payments`);
      return res.data.data;
    },
    enabled: !!orderId,
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/orders/${orderId}/payments/hybrid`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hybrid-payments', orderId] });
      setAmount('');
      setReference('');
      setProofUrl('');
      setNotes('');
      setShowAddPayment(false);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: ({ paymentId, verified, notes: vNotes }: { paymentId: string; verified: boolean; notes?: string }) =>
      apiClient.post(`/payments/${paymentId}/verify`, { verified, notes: vNotes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hybrid-payments', orderId] });
    },
  });

  if (isLoading) return <Loader className="py-8" />;
  if (!paymentsData) return null;

  const { payments = [], methods = [], totalPaid = 0, orderTotal: total = orderTotal || 0, isFullyPaid = false } = paymentsData;
  const remaining = Math.max(0, total - totalPaid);
  const progressPercent = total > 0 ? Math.min(100, Math.round((totalPaid / total) * 100)) : 0;

  const methodIcons: Record<string, any> = {
    CASH: Banknote,
    MOBILE_MONEY: Smartphone,
    BANK_TRANSFER: Building,
    CREDIT_CARD: CreditCard,
    ESCROW: Shield,
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Paiement {isFullyPaid ? 'complété' : 'en cours'}
          </h3>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Number(totalPaid).toLocaleString()} / {Number(total).toLocaleString()} FCFA
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              isFullyPaid ? 'bg-emerald-500' : 'bg-brand'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{progressPercent}% payé</span>
          {remaining > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Reste : {Number(remaining).toLocaleString()} FCFA
            </span>
          )}
        </div>
      </Card>

      {/* Payment methods used */}
      {methods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {methods.map((m: any, i: number) => {
            const Icon = methodIcons[m.method] || Wallet;
            const status = STATUS_CONFIG[m.status];
            return (
              <Badge key={i} variant={status?.variant || 'default'} size="sm" className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" />
                {m.method} · {Number(m.amount).toLocaleString()} FCFA
                {m.isManual && <FileText className="h-3 w-3 ml-0.5" />}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map((payment: any) => {
            const StatusIcon = STATUS_CONFIG[payment.status]?.icon || Wallet;
            const PayIcon = methodIcons[payment.method] || Wallet;
            return (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                    <PayIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {payment.method} · {Number(payment.amount).toLocaleString()} FCFA
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusIcon className="h-3 w-3" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {STATUS_CONFIG[payment.status]?.label || payment.status}
                      </span>
                      {payment.reference && (
                        <span className="text-xs text-gray-400">Réf: {payment.reference}</span>
                      )}
                      {payment.paidAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === 'VERIFYING' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, verified: true })}
                        isLoading={verifyPaymentMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmer
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, verified: false })}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeter
                      </Button>
                    </>
                  )}
                  {payment.proofs?.length > 0 && (
                    <a href={payment.proofs[0].imageUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="xs">
                        <FileText className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add payment */}
      {!isFullyPaid && (
        <>
          {showAddPayment ? (
            <Card padding="md" className="border-dashed border-2 border-brand/30 dark:border-brand/20">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-brand" />
                Ajouter un paiement
              </h4>

              {/* Method selection */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm',
                        selectedMethod === method.id
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Montant en FCFA"
                    max={remaining}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Référence (optionnel)</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="N° de transaction"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL de preuve (optionnel)</label>
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://exemple.com/reçu.jpg"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (optionnel)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Manual toggle */}
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManual}
                  onChange={(e) => setIsManual(e.target.checked)}
                  className="rounded border-gray-300 text-brand focus:ring-brand/20"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Paiement manuel (sera vérifié avant confirmation)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!amount || Number(amount) <= 0) return;
                    addPaymentMutation.mutate({
                      amount: Number(amount),
                      method: selectedMethod,
                      reference: reference || undefined,
                      isManual,
                      proofUrl: proofUrl || undefined,
                      notes: notes || undefined,
                    });
                  }}
                  isLoading={addPaymentMutation.isPending}
                  disabled={!amount || Number(amount) <= 0}
                >
                  <Wallet className="h-4 w-4 mr-1.5" />
                  Enregistrer le paiement
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowAddPayment(false)}>
                  Annuler
                </Button>
              </div>
            </Card>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setShowAddPayment(true)}>
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Ajouter un paiement {remaining > 0 && `(${Number(remaining).toLocaleString()} FCFA restant)`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
