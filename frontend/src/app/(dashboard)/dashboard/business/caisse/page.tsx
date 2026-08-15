'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  CheckCircle2,
  History,
  Loader,
  Lock,
  LockOpen,
  Minus,
  Plus,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';
import { enqueueSyncItem, generateClientId } from '@/lib/offline/queue';

const MOVEMENT_META: Record<string, { label: string; icon: any; badge: any }> = {
  OPENING: { label: 'Fond de caisse', icon: Wallet, badge: 'info' },
  SALE: { label: 'Vente', icon: TrendingUp, badge: 'success' },
  FREE_SALE: { label: 'Vente libre', icon: Banknote, badge: 'success' },
  EXPENSE: { label: 'Sortie de caisse', icon: TrendingDown, badge: 'danger' },
  DEBT_COLLECTION: { label: 'Encaissement dette', icon: Wallet, badge: 'success' },
  ADJUSTMENT: { label: 'Ajustement', icon: RefreshCcw, badge: 'warning' },
  WITHDRAWAL: { label: 'Retrait de caisse', icon: Minus, badge: 'warning' },
};

const IS_EXPENSE: Record<string, boolean> = { EXPENSE: true, WITHDRAWAL: true };

/** En ligne → API réelle. Hors-ligne → file client (rejouée au flush). */
async function cashMovementOfflineAware(data: any) {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const res = await apiClient.addCashMovement(data);
    return res.data?.data;
  }
  const clientId = generateClientId();
  const queued = await enqueueSyncItem({
    id: clientId,
    action: 'CREATE_CASH_MOVEMENT',
    entityType: 'CASH_MOVEMENT',
    payload: { ...data, offlineClientId: clientId },
  });
  return queued ? { offlineQueued: true, id: queued.id } : null;
}

export default function CashPage() {
  const qc = useQueryClient();
  const [openModal, setOpenModal] = useState<'open' | 'free' | 'expense' | 'close' | null>(null);
  const [opening, setOpening] = useState('');
  const [freeAmount, setFreeAmount] = useState('');
  const [freeMethod, setFreeMethod] = useState('CASH');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [actualBalance, setActualBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const todayQuery = useQuery({
    queryKey: ['cash', 'today'],
    queryFn: async () => {
      const res = await apiClient.getTodayCash();
      return res.data?.data;
    },
  });
  const historyQuery = useQuery({
    queryKey: ['cash', 'history'],
    queryFn: async () => {
      const res = await apiClient.getCashHistory();
      return res.data?.data;
    },
  });

  const today = todayQuery.data as any;
  const history = historyQuery.data as any;
  const movements: any[] = today?.movements || [];
  const isOpen = !!today?.open;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['cash'] });
  };

  const openMutation = useMutation({
    mutationFn: () => apiClient.openCashSession({ openingBalance: Number(opening || 0) }),
    onSuccess: () => {
      setOpenModal(null);
      setOpening('');
      setFlash('Caisse ouverte — fond de caisse enregistré');
      invalidate();
    },
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      apiClient.closeCashSession({
        actualBalance: Number(actualBalance || 0),
        closingNotes: closingNotes || undefined,
      }),
    onSuccess: () => {
      setOpenModal(null);
      setActualBalance('');
      setClosingNotes('');
      invalidate();
    },
  });

  const freeMutation = useMutation({
    mutationFn: () =>
      cashMovementOfflineAware({
        type: 'FREE_SALE',
        amount: Number(freeAmount || 0),
        method: freeMethod,
        label: 'Vente libre',
      }),
    onSuccess: (res: any) => {
      setOpenModal(null);
      setFreeAmount('');
      setFlash(
        res?.offlineQueued ? 'Vente libre enregistrée hors-ligne — sync automatique' : 'Vente libre encaissée'
      );
      invalidate();
    },
  });

  const expenseMutation = useMutation({
    mutationFn: () =>
      cashMovementOfflineAware({
        type: 'EXPENSE',
        amount: Number(expenseAmount || 0),
        method: 'CASH',
        label: 'Sortie de caisse',
        description: expenseLabel,
      }),
    onSuccess: (res: any) => {
      setOpenModal(null);
      setExpenseAmount('');
      setExpenseLabel('');
      setFlash(
        res?.offlineQueued ? 'Sortie de caisse enregistrée hors-ligne — sync automatique' : 'Sortie de caisse tracée'
      );
      invalidate();
    },
  });

  const totals = today?.totals;
  const difference = today?.difference;

  const quickActions = useMemo(
    () => [
      {
        key: 'free' as const,
        label: 'Vente libre',
        hint: 'Montant tapé, sans article',
        icon: Banknote,
        disabled: !isOpen,
      },
      {
        key: 'expense' as const,
        label: 'Sortie de caisse',
        hint: 'Dépense du jour tracée',
        icon: TrendingDown,
        disabled: !isOpen,
      },
    ],
    [isOpen]
  );

  const busy =
    openMutation.isPending || closeMutation.isPending || freeMutation.isPending || expenseMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Ma caisse"
        description="Le cahier de caisse du jour — chaque entrée et sortie tracée, le point du soir en 2 clics."
        actions={
          isOpen ? (
            <Button variant="outline" onClick={() => setOpenModal('close')}>
              <Lock className="h-4 w-4" /> Clôturer
            </Button>
          ) : (
            <Button onClick={() => setOpenModal('open')}>
              <LockOpen className="h-4 w-4" /> Ouvrir la caisse
            </Button>
          )
        }
      />

      {flash && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-700/30 dark:bg-emerald-900/20 dark:text-emerald-300">
          <span>{flash}</span>
          <button onClick={() => setFlash(null)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Totaux du jour ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="lg" className="relative overflow-hidden">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Dans la boîte</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatPrice(totals?.expectedBalance ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">fond + entrées − sorties</p>
          {isOpen && (
            <span className="absolute right-4 top-4">
              <Badge variant="success">Ouverte</Badge>
            </span>
          )}
        </Card>
        <Card padding="lg">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Entrées du jour</p>
          <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" /> {formatPrice(totals?.entries ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{totals?.salesCount ?? 0} ventes tracées</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Sorties du jour</p>
          <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-5 w-5" /> {formatPrice(totals?.expenses ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">dépenses + retraits</p>
        </Card>
        <Card padding="lg">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Fond de caisse</p>
          <p className="mt-2 flex items-center gap-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100">
            <Wallet className="h-5 w-5" /> {formatPrice(totals?.opening ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">monnaie du matin</p>
        </Card>
      </div>

      {/* ── Actions rapides (2 clics) ── */}
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((a) => (
          <button
            key={a.key}
            disabled={a.disabled}
            onClick={() => setOpenModal(a.key)}
            className="group flex items-center gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 text-left shadow-card transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-card-lg disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700/80 dark:bg-gray-800/90"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-400">
              <a.icon className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{a.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{a.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── Journal du jour ── */}
      <Card title="Journal du jour" titleIcon={<Receipt className="h-4 w-4" />} padding="none">
        {movements.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title={isOpen ? 'Aucun mouvement aujourd’hui' : 'Caisse non ouverte'}
            description={
              isOpen
                ? 'Les ventes, sorties et encaissements apparaîtront ici instantanément.'
                : 'Ouvrez la caisse pour commencer à tracer vos entrées et sorties.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-gray-700/60">
            {movements.map((m: any) => {
              const meta = MOVEMENT_META[m.type] || MOVEMENT_META.ADJUSTMENT;
              const Icon = meta.icon;
              const isOut = IS_EXPENSE[m.type];
              const time = new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-slate-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {m.label || meta.label}
                      {m.offlineQueued && <WifiOff className="ml-1.5 inline h-3.5 w-3.5 text-amber-500" />}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {time} · {meta.label} · {m.method === 'MOBILE_MONEY' ? 'Mobile Money' : m.method === 'CASH' ? 'Espèces' : m.method}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isOut ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isOut ? '−' : '+'}
                    {formatPrice(m.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ── Historique ── */}
      <Card title="Historique des clôtures" titleIcon={<History className="h-4 w-4" />} padding="none">
        {!history || history.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucune clôture pour le moment — le point du soir apparaîtra ici.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-gray-700/60">
            {history.map((s: any) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(s.openedAt).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Solde attendu {formatPrice(s.expectedBalance ?? 0)} · compté {formatPrice(s.actualBalance ?? 0)}
                  </p>
                </div>
                {s.difference === 0 ? (
                  <Badge variant="success">Juste</Badge>
                ) : (
                  <Badge variant={s.difference > 0 ? 'warning' : 'danger'}>
                    Écart {formatPrice(Math.abs(s.difference))}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Modals ── */}
      <Modal open={openModal === 'open'} onClose={() => setOpenModal(null)} title="Ouvrir la caisse" description="Tapez le fond de caisse du matin (la monnaie dans la boîte).">
        <div className="space-y-4">
          <Input
            type="number"
            min={0}
            placeholder="Fond de caisse (FCFA)"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpenModal(null)}>Annuler</Button>
            <Button onClick={() => openMutation.mutate()} disabled={busy}>
              {openMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
              Ouvrir
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={openModal === 'free'} onClose={() => setOpenModal(null)} title="Vente libre" description="Un montant tapé, sans article — encaissé dans la caisse du jour.">
        <div className="space-y-4">
          <Input
            type="number"
            min={1}
            placeholder="Montant encaissé (FCFA)"
            value={freeAmount}
            onChange={(e) => setFreeAmount(e.target.value)}
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {['CASH', 'MOBILE_MONEY'].map((m) => (
              <button
                key={m}
                onClick={() => setFreeMethod(m)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  freeMethod === m
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-gray-700 dark:text-slate-300'
                }`}
              >
                {m === 'CASH' ? 'Espèces' : 'Mobile Money'}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpenModal(null)}>Annuler</Button>
            <Button onClick={() => freeMutation.mutate()} disabled={busy || !Number(freeAmount)}>
              {freeMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Encaisser
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={openModal === 'expense'} onClose={() => setOpenModal(null)} title="Sortie de caisse" description="Chaque franc qui sort de la boîte est tracé, signé, auditable.">
        <div className="space-y-4">
          <Input
            placeholder="Motif (ex: eau 200F, transport 1000F…)"
            value={expenseLabel}
            onChange={(e) => setExpenseLabel(e.target.value)}
            autoFocus
          />
          <Input
            type="number"
            min={1}
            placeholder="Montant sorti (FCFA)"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpenModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => expenseMutation.mutate()} disabled={busy || !Number(expenseAmount)}>
              {expenseMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
              Enregistrer la sortie
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={openModal === 'close'} onClose={() => setOpenModal(null)} title="Clôturer la caisse" description="Le point du soir : le système calcule, vous comptez, l'écart saute aux yeux.">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Solde attendu dans la boîte
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {formatPrice(totals?.expectedBalance ?? 0)}
            </p>
          </div>
          <Input
            type="number"
            min={0}
            placeholder="Ce que vous avez réellement compté (FCFA)"
            value={actualBalance}
            onChange={(e) => setActualBalance(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Note de clôture (optionnel)"
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
          />
          {actualBalance !== '' && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 px-4 py-3 dark:border-gray-700">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Écart détecté</span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  Number(actualBalance) - (totals?.expectedBalance ?? 0) === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {Number(actualBalance) - (totals?.expectedBalance ?? 0) > 0 ? '+' : ''}
                {formatPrice(Number(actualBalance) - (totals?.expectedBalance ?? 0))}
              </span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpenModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => closeMutation.mutate()} disabled={busy || actualBalance === ''}>
              {closeMutation.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Clôturer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
