import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { publishCommissionCharged } from '../events/publishers';
import { calculateCommission } from './monetizationConfig';
import * as fedapay from '../lib/fedapay';

// Mode démonstration : sans clé API (Stripe/FedaPay) ou en environnement non
// production, les paiements sont simulés pour que le parcours complet fonctionne
// (commande → paiement → escrow → notifications). Activable/forçable via
// PAYMENT_DEMO_MODE=true|false, sinon auto : true hors production.
export function isPaymentDemoMode(): boolean {
  const explicit = process.env.PAYMENT_DEMO_MODE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

// ── Stripe ──
export async function processStripePayment(
  amount: number,
  currency: string,
  paymentMethodId: string,
  description?: string
) {
  if (isPaymentDemoMode()) {
    logger.info(`Stripe [DEMO]: payment of ${amount} ${currency} simulated`);
    return {
      providerRef: `DEMO_STRIPE_${Date.now()}`,
      status: 'SUCCESS' as const,
      fee: 0,
      message: 'Paiement Stripe simulé (mode démonstration).',
    };
  }
  try {
    const stripe = await getStripeClient();
    if (!stripe) throw new AppError('Stripe non configuré', 501);
    const payment = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      description: description || 'Paiement AfriBiz',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });
    return {
      providerRef: payment.id,
      status: payment.status === 'succeeded' ? 'SUCCESS' : 'PENDING',
      fee: 0,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('Stripe payment failed', { error: errorMessage });
    throw new AppError(`Paiement Stripe échoué: ${errorMessage}`, 400);
  }
}

export async function processMobileMoney(
  provider: string,
  phone: string,
  amount: number,
  description?: string
) {
  // 'MOBILE_MONEY' est le mode générique envoyé par le site (l'opérateur précis
  // n'est pas choisi au checkout) — accepté ici, résolu comme mobile money.
  const validProviders = [
    'MOBILE_MONEY',
    'TMONEY',
    'FLOOZ',
    'WAVE',
    'MOOV_MONEY',
    'MTN',
    'ORANGE',
    'FREE',
    'BANK_TRANSFER',
    'DEMO',
  ];
  if (!validProviders.includes(provider)) throw new AppError('Opérateur non supporté', 400);
  if (provider !== 'DEMO' && !phone?.trim()) throw new AppError('Numéro de téléphone requis', 400);
  if (amount <= 0) throw new AppError('Montant invalide', 400);

  // ── Mode démonstration (sans clé FedaPay) : parcours FIDÈLE à la plateforme ──
  // Le paiement reste PENDING comme dans la vraie vie (« confirmez sur votre
  // téléphone »). La confirmation passe par POST /payments/processor/demo/confirm,
  // qui rejoue le webhook FedaPay de production (transaction → paiement →
  // commande → caisse du jour) — zéro code parallèle.
  if (provider === 'DEMO') {
    return {
      providerRef: `sim_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: 'PENDING',
      fee: Math.round(amount * 0.01),
      message: '📲 Mode démo — paiement initié. Confirmez sur votre téléphone (simulation).',
    };
  }

  // Try FedaPay first if configured
  if (fedapay.isFedaPayAvailable()) {
    try {
      const mode = fedapay.fedapayModeForProvider(provider);
      const tx = await fedapay.createTransaction({
        amount,
        mode,
        description: description || `Paiement ${provider}`,
        customerPhone: phone,
      });

      logger.info(
        `MobileMoney: ${provider} payment via FedaPay, ref: ${tx.id}, status: ${tx.status}`
      );

      return {
        providerRef: tx.id,
        status: tx.status === 'approved' ? 'SUCCESS' : 'PENDING',
        fee: Math.round(amount * 0.012),
        message:
          tx.status === 'approved'
            ? `Paiement ${provider} réussi.`
            : `Paiement ${provider} initié. Confirmez sur votre téléphone.`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error('FedaPay mobile money failed, falling back to stub', {
        error: errorMessage,
        provider,
      });
      // Fall through to legacy simulation
    }
  }

  // Legacy simulation fallback (FedaPay not configured or failed)
  const providerRef = `${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const allowedTestPhones = [
    '22901000000',
    '22901000001',
    '22997000000',
    '22890000000',
    '22177000000',
  ];
  const isTestMode = allowedTestPhones.includes(phone.replace(/[^0-9]/g, ''));
  const isDemoMode = isPaymentDemoMode();

  if (isDemoMode || isTestMode) {
    logger.info(
      `MobileMoney ${isDemoMode ? '[DEMO]' : '[TEST]'}: ${provider} payment succeeded for ${phone}, ${amount}`
    );
    return {
      providerRef,
      status: 'SUCCESS',
      fee: Math.round(amount * 0.01),
      message: `Paiement ${provider} réussi ${isDemoMode ? '(mode démonstration).' : '(mode test).'}`,
    };
  }

  logger.info(
    `MobileMoney: ${provider} payment initiated to ${phone} for ${amount} — awaiting provider webhook`
  );
  return {
    providerRef,
    status: 'PENDING',
    fee: Math.round(amount * 0.01),
    message: `Paiement ${provider} initié. Confirmez sur votre téléphone.`,
  };
}

// ── FedaPay (unified API) ──
export async function processFedaPayPayment(params: {
  amount: number;
  currency?: string;
  mode: string;
  description?: string;
  callbackUrl?: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<{
  providerRef: string;
  status: string;
  fee: number;
  redirectUrl?: string;
  message?: string;
}> {
  try {
    const tx = await fedapay.createTransaction({
      amount: params.amount,
      currency: params.currency || 'XOF',
      mode: params.mode,
      description: params.description,
      callbackUrl: params.callbackUrl || `${config.FRONTEND_URL}/payment/callback`,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
    });

    return {
      providerRef: tx.id,
      status: tx.status === 'approved' ? 'SUCCESS' : 'PENDING',
      fee: Math.round(params.amount * 0.012),
      redirectUrl: tx.url,
      message: `Paiement FedaPay initié via ${params.mode}. ${tx.url ? 'Redirection...' : 'Confirmez sur votre téléphone.'}`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('FedaPay payment failed', { error: errorMessage });
    if (err instanceof AppError) throw err;
    throw new AppError(`Paiement FedaPay échoué: ${errorMessage}`, 400);
  }
}

export async function verifyFedaPayPayment(
  transactionId: string
): Promise<{ status: string; amount: number }> {
  try {
    const tx = await fedapay.retrieveTransaction(transactionId);
    return {
      status:
        tx.status === 'approved' ? 'SUCCESS' : tx.status === 'canceled' ? 'FAILED' : 'PENDING',
      amount: tx.amount,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    logger.error('FedaPay verification failed', { error: errorMessage });
    throw new AppError(`Vérification FedaPay échouée: ${errorMessage}`, 400);
  }
}

// ── Save transaction ──
export async function saveTransaction(data: {
  businessId: string;
  userId?: string;
  orderId?: string;
  amount: number;
  currency?: string;
  provider: string;
  providerRef?: string;
  status: string;
  fee?: number;
  metadata?: any;
}) {
  const amountNum = data.amount;
  const providerFee = data.fee || 0;
  const { rate: commissionRate, commission: platformCommission } = await calculateCommission(
    amountNum,
    'transaction'
  );

  const transaction = await prisma.paymentTransaction.create({
    data: {
      businessId: data.businessId,
      userId: data.userId || null,
      orderId: data.orderId || null,
      amount: amountNum,
      currency: data.currency || 'FCFA',
      provider: data.provider,
      providerRef: data.providerRef || null,
      status: data.status,
      fee: providerFee,
      metadata: {
        ...(data.metadata || {}),
        platformCommission,
      },
      paidAt: data.status === 'SUCCESS' ? new Date() : null,
    },
  });

  // Log the platform commission if payment was successful
  if (data.status === 'SUCCESS' && platformCommission > 0) {
    try {
      await prisma.financialLog.create({
        data: {
          businessId: data.businessId,
          userId: data.userId || null,
          action: 'MANUAL_ADJUSTMENT',
          amount: -platformCommission,
          description: `Commission AfriBiz ${(commissionRate * 100).toFixed(1)}% sur paiement ${data.provider} de ${amountNum} FCFA`,
          metadata: {
            commissionType: 'TRANSACTION_FEE',
            paymentAmount: amountNum,
            commissionRate,
            transactionId: transaction.id,
            provider: data.provider,
            providerRef: data.providerRef,
          },
        },
      });

      // La commission est prélevée sur les gains du business → la notifier au
      // propriétaire du business (et non à l'acheteur `data.userId`, qui paye
      // le prix plein : dans le checkout client, ça lui annonçait à tort une
      // commission qu'il ne supporte pas).
      const commissionBusiness = await prisma.business.findUnique({
        where: { id: data.businessId },
        select: { id: true, name: true, ownerId: true },
      });
      if (commissionBusiness?.ownerId) {
        publishCommissionCharged({
          userId: commissionBusiness.ownerId,
          amount: String(platformCommission),
          businessName: commissionBusiness.name || 'AfriBiz',
          businessId: data.businessId,
        });
      }
    } catch (e) {
      logger.error('Failed to log platform commission', { error: e });
    }
  }

  return transaction;
}

// ── Stripe client lazy init ──
async function getStripeClient() {
  try {
    const stripeModule = await import('stripe');
    if (config.STRIPE_SECRET_KEY) {
      return new (stripeModule as any).Stripe(config.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia' as any,
      });
    }
    return null;
  } catch {
    return null;
  }
}
