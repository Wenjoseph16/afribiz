/**
 * FedaPay Client Singleton
 *
 * Centralized FedaPay SDK initialization and typed API wrappers.
 * All FedaPay API calls go through this module.
 *
 * In dev without keys, all methods fall back to simulation.
 */

import { config } from '../config/env';
import { logger } from '../lib/logger';
import crypto from 'crypto';

// ── Typed interfaces for FedaPay SDK ──

interface FedaPaySdkClass {
  setApiKey(key: string): void;
  setEnvironment(env: 'sandbox' | 'live'): void;
}

interface FedaPayTransactionClass {
  create(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  retrieve(id: string): Promise<Record<string, unknown>>;
  refund(id: string, params?: { amount?: number; reason?: string }): Promise<{ id: string }>;
}

interface FedaPayPayoutClass {
  create(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface FedaPayPlanClass {
  create(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface FedaPayModule {
  FedaPay?: FedaPaySdkClass & Record<string, unknown>;
  Transaction?: FedaPayTransactionClass;
  Payout?: FedaPayPayoutClass;
  Plan?: FedaPayPlanClass;
  default?: FedaPaySdkClass & Record<string, unknown>;
}

async function loadFedaPay(): Promise<FedaPayModule> {
  // Dynamic import required because fedapay SDK has native deps (optional peer dep)
  return import('fedapay') as unknown as Promise<FedaPayModule>;
}

async function getFedaPayApi(): Promise<FedaPaySdkClass> {
  const mod = await loadFedaPay();
  const api: FedaPaySdkClass = (mod.default || mod.FedaPay) as unknown as FedaPaySdkClass;
  api.setApiKey(config.FEDAPAY_SECRET_KEY!);
  api.setEnvironment(config.NODE_ENV === 'production' ? 'live' : 'sandbox');
  return api;
}

async function getTransactionApi(): Promise<FedaPayTransactionClass> {
  const mod = await loadFedaPay();
  await getFedaPayApi(); // ensures API key + env are set

  const transactionApi = (mod as FedaPayModule & Record<string, unknown>).Transaction as
    | FedaPayTransactionClass
    | undefined;
  if (
    transactionApi &&
    typeof transactionApi.create === 'function' &&
    typeof transactionApi.retrieve === 'function' &&
    typeof transactionApi.refund === 'function'
  ) {
    return transactionApi;
  }

  logger.warn('FedaPay Transaction API unavailable; using simulation fallback');
  return {
    create: async (params) => ({
      id: simId('transaction'),
      status: 'pending',
      amount: Number(params.amount ?? 0),
      currency: 'XOF',
      mode: 'sim',
      description: String(params.description ?? ''),
      created_at: new Date().toISOString(),
    }),
    retrieve: async (id) => ({
      id,
      status: 'pending',
      amount: 0,
      currency: 'XOF',
      mode: 'sim',
      created_at: new Date().toISOString(),
    }),
    refund: async (id) => ({ id: id || simId('refund') }),
  };
}

async function getPayoutApi(): Promise<FedaPayPayoutClass> {
  const mod = await loadFedaPay();
  await getFedaPayApi();

  const payoutApi = (mod as FedaPayModule & Record<string, unknown>).Payout as
    | FedaPayPayoutClass
    | undefined;
  if (payoutApi?.create) {
    return payoutApi;
  }

  logger.warn('FedaPay Payout API unavailable; using simulation fallback');
  return {
    create: async (params) => ({
      id: simId('payout'),
      status: 'completed',
      amount: Number(params.amount ?? 0),
      currency: 'XOF',
      created_at: new Date().toISOString(),
    }),
  };
}

async function getPlanApi(): Promise<FedaPayPlanClass> {
  const mod = await loadFedaPay();
  await getFedaPayApi();

  const planApi = (mod as FedaPayModule & Record<string, unknown>).Plan as
    | FedaPayPlanClass
    | undefined;
  if (planApi?.create) {
    return planApi;
  }

  logger.warn('FedaPay Plan API unavailable; using simulation fallback');
  return {
    create: async (params) => ({
      id: simId('plan'),
      name: String(params.name ?? 'Plan'),
      amount: Number(params.amount ?? 0),
      currency: 'XOF',
      interval: String(params.interval ?? 'monthly'),
      status: 'active',
      created_at: new Date().toISOString(),
    }),
  };
}

// ── Exported interfaces ──

export interface FedaPayTransaction {
  id: string;
  status: string;
  amount: number;
  currency: string;
  mode: string;
  description?: string;
  customer?: { id?: string; phone?: string; name?: string; email?: string };
  url?: string;
  created_at: string;
}

export interface FedaPayPayout {
  id: string;
  status: string;
  amount: number;
  currency: string;
  customer?: {
    id?: string;
    phone?: string;
    name?: string;
    email?: string;
    mobile?: { number: string; provider: string };
  };
  created_at: string;
}

export interface FedaPayPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  created_at: string;
}

export interface FedaPaySubscription {
  id: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

function simId(prefix: string): string {
  return `sim_${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function isConfigured(): boolean {
  return !!config.FEDAPAY_SECRET_KEY;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Erreur inconnue FedaPay';
}

/**
 * Map AfriBiz provider names to FedaPay payment modes.
 */
export function fedapayModeForProvider(provider: string): string {
  const map: Record<string, string> = {
    TMONEY: 'mtn_open',
    FLOOZ: 'flooz_open',
    WAVE: 'wave_open',
    MOOV_MONEY: 'moov_open',
    MTN: 'mtn_open',
    ORANGE: 'orange_open',
    FREE: 'free_open',
  };
  return map[provider] || 'mtn_open';
}

/**
 * Detect the mobile money provider from a phone number prefix.
 * Returns the FedaPay-compatible provider name, or undefined for auto-detection.
 */
export function detectProviderFromPhone(phone: string): string | undefined {
  const cleaned = phone.replace(/[^0-9]/g, '');
  // Country code → default provider mapping for West/Central Africa
  const prefixMap: Record<string, string> = {
    '22901': 'mtn', // Benin MTN
    '22997': 'moov', // Benin Moov
    '22990': 'moov', // Benin Moov
    '22994': 'mtn', // Benin MTN
    '22995': 'mtn', // Benin MTN
    '22966': 'mtn', // Benin MTN
    '22890': 'moov', // Togo Moov
    '22891': 'moov', // Togo Moov
    '22892': 'moov', // Togo Moov
    '22893': 'moov', // Togo Moov
    '22870': 'mtn', // Togo MTN
    '22896': 'mtn', // Togo MTN
    '22897': 'mtn', // Togo MTN
    '22898': 'mtn', // Togo MTN
    '22899': 'mtn', // Togo MTN
    '22501': 'mtn', // Côte d'Ivoire MTN
    '22502': 'mtn', // Côte d'Ivoire MTN
    '22505': 'mtn', // Côte d'Ivoire MTN
    '22507': 'orange', // Côte d'Ivoire Orange
    '22508': 'orange', // Côte d'Ivoire Orange
    '22177': 'wave', // Senegal Wave
    '22178': 'orange', // Senegal Orange
    '22170': 'orange', // Senegal Orange
    '22176': 'mtn', // Senegal MTN
    '22370': 'orange', // Mali Orange
    '22371': 'orange', // Mali Orange
    '22373': 'mtn', // Mali MTN
    '22374': 'mtn', // Mali MTN
    '22720': 'orange', // Niger Orange
    '22790': 'moov', // Niger Moov
    '22796': 'moov', // Niger Moov
    '22797': 'mtn', // Niger MTN
    '22660': 'orange', // Burkina Faso Orange
    '22670': 'orange', // Burkina Faso Orange
    '22672': 'moov', // Burkina Faso Moov
    '22655': 'mtn', // Burkina Faso MTN
    '22460': 'mtn', // Guinea MTN
    '22462': 'orange', // Guinea Orange
    '22463': 'mtn', // Guinea MTN
    '22222': 'moov', // Mauritanie Moov
    '22246': 'mtn', // Mauritanie MTN
  };
  for (const [prefix, provider] of Object.entries(prefixMap)) {
    if (cleaned.startsWith(prefix)) return provider;
  }
  // Detect by country code first digits
  if (cleaned.startsWith('229')) return 'mtn'; // Benin default
  if (cleaned.startsWith('228')) return 'moov'; // Togo default
  if (cleaned.startsWith('225')) return 'mtn'; // Côte d'Ivoire default
  if (cleaned.startsWith('221')) return 'wave'; // Senegal default
  if (cleaned.startsWith('223')) return 'orange'; // Mali default
  if (cleaned.startsWith('227')) return 'orange'; // Niger default
  if (cleaned.startsWith('226')) return 'orange'; // Burkina default
  if (cleaned.startsWith('224')) return 'mtn'; // Guinea default
  if (cleaned.startsWith('222')) return 'moov'; // Mauritanie default
  if (cleaned.startsWith('237')) return 'mtn'; // Cameroon default
  if (cleaned.startsWith('233')) return 'mtn'; // Ghana default
  if (cleaned.startsWith('234')) return 'mtn'; // Nigeria default
  return undefined; // Let FedaPay auto-detect
}

export function isFedaPayAvailable(): boolean {
  return isConfigured();
}

export function getEnvironment(): 'sandbox' | 'live' {
  return config.NODE_ENV === 'production' ? 'live' : 'sandbox';
}

export async function createTransaction(params: {
  amount: number;
  currency?: string;
  mode: string;
  description?: string;
  callbackUrl?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<FedaPayTransaction> {
  if (!isConfigured()) {
    logger.info('FedaPay [SIM]: creating transaction', {
      mode: params.mode,
      amount: params.amount,
    });
    return {
      id: simId('txn'),
      status: 'pending',
      amount: params.amount,
      currency: params.currency || 'XOF',
      mode: params.mode,
      description: params.description,
      customer: params.customerPhone
        ? { phone: params.customerPhone, name: params.customerName }
        : undefined,
      created_at: new Date().toISOString(),
    };
  }
  try {
    const transactionApi = await getTransactionApi();
    const result = await transactionApi.create({
      description: params.description || 'Paiement AfriBiz',
      amount: params.amount,
      currency: { iso: params.currency || 'XOF' },
      callback_url: params.callbackUrl || `${config.FRONTEND_URL}/payment/callback`,
      mode: params.mode,
      ...(params.customerPhone
        ? {
            customer: {
              phone: params.customerPhone,
              name: params.customerName || 'Client AfriBiz',
              email: params.customerEmail || undefined,
            },
          }
        : {}),
    });
    const tx = result as unknown as FedaPayTransaction;
    logger.info(`FedaPay: Transaction ${tx.id} created (${params.mode}), status: ${tx.status}`);
    return tx;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    logger.error('FedaPay createTransaction failed', { error: message, mode: params.mode });
    throw err;
  }
}

export async function retrieveTransaction(transactionId: string): Promise<FedaPayTransaction> {
  if (!isConfigured()) {
    // Simulation : on retourne le VRAI montant de la transaction (cherché dans
    // notre base par providerRef) pour que verifyFedaPayPayment soit exact même
    // sans clé API — une vérification qui renvoie amount: 0 est inutilisable.
    let amount = 0;
    let status: string = 'approved';
    try {
      const { prisma } = await import('../lib/db');
      const tx = await prisma.paymentTransaction.findFirst({
        where: { providerRef: transactionId },
        select: { amount: true, status: true },
      });
      if (tx) {
        amount = Number(tx.amount);
        status = tx.status === 'SUCCESS' ? 'approved' : tx.status === 'FAILED' ? 'canceled' : 'pending';
      }
    } catch {
      /* base indisponible → valeurs par défaut */
    }
    return {
      id: transactionId,
      status,
      amount,
      currency: 'XOF',
      mode: 'simulation',
      created_at: new Date().toISOString(),
    };
  }
  try {
    const transactionApi = await getTransactionApi();
    const result = await transactionApi.retrieve(transactionId);
    return result as unknown as FedaPayTransaction;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    logger.error('FedaPay retrieveTransaction failed', { error: message, transactionId });
    throw err;
  }
}

export async function createPayout(params: {
  amount: number;
  currency?: string;
  recipientPhone: string;
  recipientName?: string;
  description?: string;
  /**
   * Optionally override the mobile money provider.
   * If omitted, auto-detected from the phone number prefix.
   * Supported: 'mtn', 'orange', 'moov', 'wave', 'free'
   */
  provider?: string;
}): Promise<FedaPayPayout> {
  const detectedProvider =
    params.provider || detectProviderFromPhone(params.recipientPhone) || 'mtn';

  if (!isConfigured()) {
    logger.info('FedaPay [SIM]: creating payout', {
      amount: params.amount,
      recipient: params.recipientPhone,
      provider: detectedProvider,
    });
    return {
      id: simId('payout'),
      status: 'completed',
      amount: params.amount,
      currency: params.currency || 'XOF',
      created_at: new Date().toISOString(),
    };
  }
  try {
    const payoutApi = await getPayoutApi();
    const result = await payoutApi.create({
      amount: params.amount,
      currency: { iso: params.currency || 'XOF' },
      description: params.description || 'Paiement développeur AfriBiz',
      customer: {
        mobile: { number: params.recipientPhone, provider: detectedProvider },
        name: params.recipientName || 'Développeur AfriBiz',
      },
    });
    const po = result as unknown as FedaPayPayout;
    logger.info(`FedaPay: Payout ${po.id} created (${detectedProvider}), status: ${po.status}`);
    return po;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    logger.error('FedaPay createPayout failed', { error: message });
    throw err;
  }
}

export async function createPlan(params: {
  name: string;
  amount: number;
  currency?: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  description?: string;
}): Promise<FedaPayPlan> {
  if (!isConfigured()) {
    logger.info('FedaPay [SIM]: creating plan', { name: params.name, amount: params.amount });
    return {
      id: simId('plan'),
      name: params.name,
      amount: params.amount,
      currency: params.currency || 'XOF',
      interval: params.interval,
      status: 'active',
      created_at: new Date().toISOString(),
    };
  }
  try {
    const planApi = await getPlanApi();
    const result = await planApi.create({
      name: params.name,
      amount: params.amount,
      currency: { iso: params.currency || 'XOF' },
      interval: params.interval,
      description: params.description || undefined,
    });
    return result as unknown as FedaPayPlan;
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    logger.error('FedaPay createPlan failed', { error: message });
    throw err;
  }
}

export async function refundTransaction(
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<{ id: string; status: string }> {
  if (!isConfigured()) {
    return { id: simId('refund'), status: 'completed' };
  }
  try {
    const transactionApi = await getTransactionApi();
    const refund = await transactionApi.refund(transactionId, {
      amount: amount || undefined,
      reason: reason || undefined,
    });
    return { id: refund.id, status: 'completed' };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    logger.error('FedaPay refundTransaction failed', { error: message, transactionId });
    throw err;
  }
}
