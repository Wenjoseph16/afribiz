'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PiggyBank,
  Lock,
  Wallet,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Tag,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

function ProgressRing({ progress, size = 72 }: { progress: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={progress >= 100 ? 'text-emerald-500' : 'text-brand-500'}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{progress}%</span>
      </div>
    </div>
  );
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
  ACTIVE: { label: 'En cours', variant: 'info' },
  READY: { label: 'Complet — à valider', variant: 'success' },
  COMPLETED: { label: 'Acheté', variant: 'success' },
  CANCELLED: { label: 'Annulé', variant: 'default' },
};

export default function MyLayawayPage() {
  const qc = useQueryClient();
  const [contributePlan, setContributePlan] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('WAVE');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Modal dates pour chambre / location (la conversion crée une vraie réservation)
  const [confirmDates, setConfirmDates] = useState<any | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  // Code promo optionnel : la remise s'applique réellement à la validation
  const [couponCode, setCouponCode] = useState('');

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['my-layaway'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyLayawayPlans();
        return res.data.data?.plans || [];
      } catch {
        return [];
      }
    },
  });

  const openContribute = (plan: any) => {
    setContributePlan(plan);
    setAmount(String(Math.min(plan.minInstallment || 5000, plan.remaining || 5000)));
    setMethod('WAVE');
    setPhone('');
    setError('');
  };

  const doContribute = async () => {
    if (!contributePlan) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Montant invalide');
      return;
    }
    setSending(true);
    setError('');
    try {
      await apiClient.contributeLayaway(contributePlan.id, { amount: amt, method, phone });
      setContributePlan(null);
      qc.invalidateQueries({ queryKey: ['my-layaway'] });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de la cotisation");
    } finally {
      setSending(false);
    }
  };

  const doCancel = async () => {
    if (!confirmCancel) return;
    setConfirming(true);
    try {
      await apiClient.cancelLayawayPlan(confirmCancel.id);
      setConfirmCancel(null);
      qc.invalidateQueries({ queryKey: ['my-layaway'] });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'annulation");
    } finally {
      setConfirming(false);
    }
  };

  const defaultCheckIn = () => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };
  const defaultCheckOut = () => {
    const d = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const openConfirmDates = (plan: any) => {
    setCheckIn(defaultCheckIn());
    setCheckOut(defaultCheckOut());
    setGuests('1');
    setError('');
    setConfirmDates(plan);
  };

  const doConfirmCheckout = async (plan: any, dates?: { checkIn?: string; checkOut?: string; guests?: number }): Promise<boolean> => {
    setConfirming(true);
    setError('');
    try {
      await apiClient.confirmLayawayCheckout(plan.id, {
        ...dates,
        couponCode: couponCode.trim() || undefined,
      });
      setCouponCode('');
      qc.invalidateQueries({ queryKey: ['my-layaway'] });
      return true;
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de la validation");
      return false;
    } finally {
      setConfirming(false);
    }
  };

  // Chambre / location : on demande les dates avant de convertir l'épargne en réservation
  const handleReadyClick = (plan: any) => {
    if (plan.itemType === 'ROOM' || plan.itemType === 'RENTAL') {
      openConfirmDates(plan);
    } else {
      doConfirmCheckout(plan);
    }
  };

  const todayIso = () => new Date().toISOString().slice(0, 10);

  const doConfirmWithDates = async () => {
    if (!confirmDates) return;
    if (!checkIn || !checkOut) {
      setError('Renseignez les dates d\'arrivée et de départ');
      return;
    }
    if (checkOut <= checkIn) {
      setError('La date de départ doit être après la date d\'arrivée');
      return;
    }
    const ok = await doConfirmCheckout(confirmDates, {
      checkIn: new Date(checkIn + 'T12:00:00').toISOString(),
      checkOut: new Date(checkOut + 'T11:00:00').toISOString(),
      guests: Math.max(1, Number(guests) || 1),
    });
    if (ok) setConfirmDates(null);
  };

  const plans = Array.isArray(data) ? data : [];
  const totalSaved = plans
    .filter((p: any) => p.status !== 'CANCELLED')
    .reduce((s: number, p: any) => s + Number(p.savedAmount || 0), 0);
  const activeCount = plans.filter((p: any) => ['ACTIVE', 'READY'].includes(p.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mes épargnes"
        description="Épargnez en toute sécurité pour acheter ce qui vous fait envie — votre argent est sécurisé en escrow"
        breadcrumbs={[{ label: 'Épargne Achat' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard icon={<PiggyBank className="h-5 w-5" />} label="Plans actifs" value={activeCount} />
        <StatsCard icon={<Wallet className="h-5 w-5" />} label="Total épargné" value={`${formatPrice(totalSaved)}`} />
        <StatsCard icon={<Lock className="h-5 w-5" />} label="Sécurisé en escrow" value="100%" />
        <StatsCard icon={<Sparkles className="h-5 w-5" />} label="Commission" value="0%" />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Zéro risque :</strong> chaque cotisation est bloquée en <strong>escrow AfriBiz</strong> — le vendeur
          ne touche votre argent qu&apos;à la livraison. Vous pouvez annuler et être <strong>remboursé à 100%</strong> à
          tout moment, sans frais.
        </p>
      </div>

      {isLoading ? (
        <Loader variant="spinner" size="md" fullScreen />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="h-10 w-10" />}
          title="Aucun plan épargne"
          description="Retrouvez ici vos plans d'épargne. Cherchez un produit avec le badge 🔒 Épargne dans le marketplace pour commencer."
          action={
            <Link href="/dashboard/explore">
              <Button>
                Explorer le marketplace <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan: any) => {
            const st = statusConfig[plan.status] || { label: plan.status, variant: 'default' };
            return (
              <Card key={plan.id} className="p-5 relative overflow-hidden group hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <ProgressRing progress={plan.progress} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {plan.itemName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatPrice(plan.savedAmount)} / {formatPrice(plan.targetAmount)}
                    </p>
                    <Badge variant={st.variant} size="sm" className="mt-2">
                      {st.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Restant à épargner</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {formatPrice(plan.remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cotisation minimale</span>
                    <span>{formatPrice(plan.minInstallment)}</span>
                  </div>
                  {plan.expiresAt && plan.status === 'ACTIVE' && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Échéance
                      </span>
                      <span>{new Date(plan.expiresAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>

                {plan.status === 'ACTIVE' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="primary" onClick={() => openContribute(plan)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Cotiser
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmCancel(plan)} className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Annuler
                    </Button>
                  </div>
                )}
                {plan.status === 'READY' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Code promo (optionnel)"
                          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleReadyClick(plan)}
                      disabled={confirming}
                    >
                      {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                      {plan.itemType === 'ROOM'
                        ? `Réserver ({formatPrice(plan.targetAmount)})`
                        : plan.itemType === 'RENTAL'
                          ? `Louer ({formatPrice(plan.targetAmount)})`
                          : plan.itemType === 'EVENT'
                            ? `Obtenir mon billet ({formatPrice(plan.targetAmount)})`
                            : plan.itemType === 'TRAINING'
                              ? `Valider mon inscription ({formatPrice(plan.targetAmount)})`
                              : `Valider mon achat ({formatPrice(plan.targetAmount)})`}
                    </Button>
                  </div>
                )}
                {plan.status === 'COMPLETED' && (
                  <Link
                    href={
                      plan.itemType === 'ROOM'
                        ? '/dashboard/bookings'
                        : plan.itemType === 'RENTAL'
                          ? '/dashboard/my-rentals'
                          : plan.itemType === 'EVENT'
                            ? '/dashboard/my-events'
                            : plan.itemType === 'TRAINING'
                              ? '/dashboard/my-trainings'
                              : plan.orderId
                                ? `/dashboard/orders/${plan.orderId}`
                                : '/dashboard/my-layaway'
                    }
                    className="mt-4 block"
                  >
                    <Button size="sm" variant="secondary" className="w-full">
                      {plan.itemType === 'ROOM' || plan.itemType === 'RENTAL' ? (
                        <><Calendar className="h-3.5 w-3.5 mr-1.5" /> Voir ma réservation</>
                      ) : plan.itemType === 'EVENT' ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Voir mon billet</>
                      ) : plan.itemType === 'TRAINING' ? (
                        <><GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Accéder à ma formation</>
                      ) : (
                        <><ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Suivre ma commande</>
                      )}
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal cotisation */}
      <Modal
        open={!!contributePlan}
        onClose={() => setContributePlan(null)}
        title={`Cotiser — ${contributePlan?.itemName || ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Votre argent est bloqué en escrow jusqu&apos;à la livraison. Remboursement intégral à tout moment.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[5000, 10000, 25000, 50000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  Number(amount) === v
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                {formatPrice(v)}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Montant personnalisé (FCFA)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={contributePlan?.minInstallment || 1000}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Min {formatPrice(contributePlan?.minInstallment)} · Max {formatPrice(contributePlan?.remaining)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Moyen de paiement</label>
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                options={[
                  { value: 'WAVE', label: 'Wave' },
                  { value: 'ORANGE', label: 'Orange Money' },
                  { value: 'MTN', label: 'MTN MoMo' },
                  { value: 'TMONEY', label: 'TMoney' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Numéro</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 ..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}
          <Button variant="primary" className="w-full" onClick={doContribute} disabled={sending || !amount}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            {sending ? 'Sécurisation en escrow...' : `Cotiser ${amount ? formatPrice(Number(amount)) : ''}`}
          </Button>
        </div>
      </Modal>

      {/* Modal dates — chambre / location */}
      <Modal
        open={!!confirmDates}
        onClose={() => setConfirmDates(null)}
        title={confirmDates?.itemType === 'RENTAL' ? 'Confirmer la location' : 'Confirmer la réservation'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Votre épargne ({formatPrice(confirmDates?.targetAmount)}) couvre{' '}
            <strong className="text-gray-900 dark:text-white">{confirmDates?.itemName}</strong>. Indiquez vos dates :
            la réservation sera créée directement chez le business, déjà payée.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Arrivée</label>
              <input
                type="date"
                value={checkIn}
                min={todayIso()}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Départ</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || defaultCheckIn()}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Voyageurs</label>
            <input
              type="number"
              min={1}
              max={10}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Code promo <span className="text-gray-400 font-normal">(optionnel — remise appliquée à l&apos;achat)</span>
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ex : WELCOME10"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}
          <Button variant="primary" className="w-full" onClick={doConfirmWithDates} disabled={confirming}>
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
            {confirming ? 'Création de la réservation...' : 'Confirmer — réservation payée par mon épargne'}
          </Button>
        </div>
      </Modal>

      {/* Modal annulation */}
      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Annuler ce plan épargne ?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous serez <strong>remboursé à 100%</strong> de{' '}
            <strong className="text-gray-900 dark:text-white">
              {formatPrice(confirmCancel?.savedAmount)}
            </strong>{' '}
            sans aucun frais. L&apos;argent n&apos;a jamais été chez le vendeur.
          </p>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmCancel(null)}>
              Garder mon épargne
            </Button>
            <Button variant="primary" className="flex-1 bg-red-500 hover:bg-red-600" onClick={doCancel} disabled={confirming}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer l\'annulation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
