import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { publishCommissionCharged } from '../events/publishers';
import { calculateCommission } from './monetizationConfig';

// ── Stripe ──
export async function processStripePayment(amount: number, currency: string, paymentMethodId: string, description?: string) {
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
    return { providerRef: payment.id, status: payment.status === 'succeeded' ? 'SUCCESS' : 'PENDING', fee: 0 };
  } catch (err: any) {
    logger.error('Stripe payment failed', { error: err.message });
    throw new AppError(`Paiement Stripe échoué: ${err.message}`, 400);
  }
}

export async function processMobileMoney(provider: string, phone: string, amount: number, description?: string) {
  const validProviders = ['TMONEY', 'FLOOZ', 'WAVE', 'MOOV_MONEY'];
  if (!validProviders.includes(provider)) throw new AppError('Opérateur non supporté', 400);
  if (!phone?.trim()) throw new AppError('Numéro de téléphone requis', 400);
  if (amount <= 0) throw new AppError('Montant invalide', 400);

  // Mobile Money API simulation — returns PENDING until webhook confirms
  // Integrate with TMONEY/FLOOZ/WAVE API here in production
  const providerRef = `${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const allowedTestPhones = ['22901000000', '22901000001', '22997000000', '22890000000', '22177000000'];
  const isTestMode = allowedTestPhones.includes(phone.replace(/[^0-9]/g, ''));

  if (isTestMode) {
    logger.info(`MobileMoney [TEST]: ${provider} payment succeeded for ${phone}, ${amount}`);
    return { providerRef, status: 'SUCCESS', fee: Math.round(amount * 0.01), message: `Paiement ${provider} réussi (mode test).` };
  }

  logger.info(`MobileMoney: ${provider} payment initiated to ${phone} for ${amount} — awaiting provider webhook`);
  return { providerRef, status: 'PENDING', fee: Math.round(amount * 0.01), message: `Paiement ${provider} initié. Confirmez sur votre téléphone.` };
}

// ── Save transaction ──
export async function saveTransaction(data: {
  businessId: string; userId?: string; orderId?: string;
  amount: number; currency?: string; provider: string;
  providerRef?: string; status: string; fee?: number; metadata?: any;
}) {
  const amountNum = data.amount;
  const providerFee = data.fee || 0;
  const { rate: commissionRate, commission: platformCommission } = await calculateCommission(amountNum, 'transaction');

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

      if (data.userId) {
        publishCommissionCharged({
          userId: data.userId,
          amount: String(platformCommission),
          businessName: 'AfriBiz',
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
      return new (stripeModule as any).Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any });
    }
    return null;
  } catch {
    return null;
  }
}
