import { prisma } from '../lib/db';
import { SecurityLogAction } from '@prisma/client';
import { SecurityLogRepository } from '../repositories/securityLogRepository';
import { trackAnalyticsEvent } from './analyticsService';
import { logger } from '../lib/logger';
import {
  publishBusinessActivated,
  publishModuleApproved,
  publishModuleRejected,
  publishAdApproved,
  publishAdRejected,
  publishEscrowReleased,
  publishEscrowRefunded,
  publishDisputeResolved,
  publishSecurityAlert,
} from '../events/publishers';

/**
 * Centralise les effets de bord d'une action admin :
 *  1. Journal de sécurité (SecurityLog) — piste d'audit
 *  2. Analytics (AnalyticsEvent type 'admin')
 * Tous les appels sont NON-bloquants (fire-and-forget) : une panne de log
 * ne doit jamais faire échouer l'action métier.
 */
export async function logAdminAction(params: {
  adminUserId: string;
  action: SecurityLogAction;
  targetUserId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await SecurityLogRepository.create({
      userId: params.adminUserId,
      action: params.action,
      success: true,
      reason: params.reason,
      metadata: { targetUserId: params.targetUserId, ...params.metadata },
    });
  } catch (err) {
    logger.warn(`[admin] SecurityLog échoué (non-bloquant)`, { error: (err as Error).message });
  }
}

export async function trackAdminAction(params: {
  adminUserId: string;
  eventName: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  await trackAnalyticsEvent({
    userId: params.adminUserId,
    type: 'admin',
    category: 'admin',
    eventName: params.eventName,
    properties: params.properties,
  }).catch((err: Error) =>
    logger.warn(`[admin] Analytics échoué (non-bloquant)`, { error: err.message })
  );
}

// ============================================================
// BUSINESS
// ============================================================

/**
 * Business vérifié/activé → notification au propriétaire (BUSINESS_ACTIVATED).
 */
export async function notifyBusinessVerified(businessId: string): Promise<void> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });
    if (!business) return;
    publishBusinessActivated({
      userId: business.ownerId,
      businessId,
      businessName: business.name,
    });
  } catch (err) {
    logger.warn(`[admin] notifyBusinessVerified échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// MODULES (marketplace développeurs)
// ============================================================

async function getModuleOwnerUserId(moduleId: string): Promise<string | null> {
  const mod = await prisma.developerModule.findUnique({
    where: { id: moduleId },
    select: { name: true, developer: { select: { userId: true } } },
  });
  return mod?.developer?.userId || null;
}

export async function notifyModuleStatus(
  moduleId: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<void> {
  try {
    const mod = await prisma.developerModule.findUnique({
      where: { id: moduleId },
      select: { name: true, developer: { select: { userId: true } } },
    });
    const userId = mod?.developer?.userId;
    if (!userId || !mod) return;
    if (status === 'approved') {
      publishModuleApproved({ userId, moduleId, moduleName: mod.name });
    } else {
      publishModuleRejected({ userId, moduleId, moduleName: mod.name, reason: reason || 'Refusé' });
    }
  } catch (err) {
    logger.warn(`[admin] notifyModuleStatus échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// ADS
// ============================================================

async function getAdOwnerUserId(
  campaignId: string
): Promise<{ userId: string | null; name: string }> {
  const camp = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    select: { name: true, businessId: true, companyName: true },
  });
  if (!camp) return { userId: null, name: '' };
  if (camp.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: camp.businessId },
      select: { ownerId: true },
    });
    if (business?.ownerId)
      return { userId: business.ownerId, name: camp.name || camp.companyName || '' };
  }
  return { userId: null, name: camp.name || camp.companyName || '' };
}

export async function notifyAdStatus(
  campaignId: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<void> {
  try {
    const { userId, name } = await getAdOwnerUserId(campaignId);
    if (!userId) return;
    if (status === 'approved') {
      publishAdApproved({ userId, adId: campaignId, businessName: name });
    } else {
      publishAdRejected({
        userId,
        adId: campaignId,
        businessName: name,
        reason: reason || 'Refusée',
      });
    }
  } catch (err) {
    logger.warn(`[admin] notifyAdStatus échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// ESCROW
// ============================================================

async function getEscrowContext(escrowId: string) {
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    select: {
      amount: true,
      businessId: true,
      orderId: true,
      business: { select: { ownerId: true, name: true } },
    },
  });
  if (!escrow) return null;
  const buyerUserId = escrow.orderId
    ? (
        await prisma.order.findUnique({
          where: { id: escrow.orderId },
          select: { buyerId: true },
        })
      )?.buyerId
    : null;
  return {
    amount: Number(escrow.amount),
    sellerUserId: escrow.business?.ownerId || null,
    buyerUserId: buyerUserId || null,
    businessName: escrow.business?.name || 'AfriBiz',
  };
}

export async function notifyEscrowReleased(escrowId: string): Promise<void> {
  try {
    const ctx = await getEscrowContext(escrowId);
    if (!ctx) return;
    const amount = String(ctx.amount);
    if (ctx.sellerUserId) publishEscrowReleased({ userId: ctx.sellerUserId, escrowId, amount });
    if (ctx.buyerUserId && ctx.buyerUserId !== ctx.sellerUserId)
      publishEscrowReleased({ userId: ctx.buyerUserId, escrowId, amount });
  } catch (err) {
    logger.warn(`[admin] notifyEscrowReleased échoué`, { error: (err as Error).message });
  }
}

export async function notifyEscrowRefunded(escrowId: string): Promise<void> {
  try {
    const ctx = await getEscrowContext(escrowId);
    if (!ctx) return;
    const amount = String(ctx.amount);
    if (ctx.sellerUserId) publishEscrowRefunded({ userId: ctx.sellerUserId, escrowId, amount });
    if (ctx.buyerUserId && ctx.buyerUserId !== ctx.sellerUserId)
      publishEscrowRefunded({ userId: ctx.buyerUserId, escrowId, amount });
  } catch (err) {
    logger.warn(`[admin] notifyEscrowRefunded échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// LITIGES
// ============================================================

export async function notifyDisputeResolved(escrowId: string): Promise<void> {
  try {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      select: { business: { select: { ownerId: true, name: true } } },
    });
    const sellerUserId = escrow?.business?.ownerId;
    if (!sellerUserId) return;
    publishDisputeResolved({
      userId: sellerUserId,
      disputeId: escrowId,
      businessName: escrow.business?.name || 'AfriBiz',
    });
  } catch (err) {
    logger.warn(`[admin] notifyDisputeResolved échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// AVERTISSEMENTS (warnings)
// ============================================================

export async function notifyUserWarned(params: { userId: string; reason: string }): Promise<void> {
  try {
    publishSecurityAlert({
      userId: params.userId,
      device: 'Administration',
      location: params.reason,
    });
  } catch (err) {
    logger.warn(`[admin] notifyUserWarned échoué`, { error: (err as Error).message });
  }
}

// ============================================================
// MODÉRATION MÉDIA (stories / shorts / lives)
// ============================================================

export type MediaTarget =
  | { kind: 'story'; id: string }
  | { kind: 'short'; id: string }
  | { kind: 'live'; id: string };

/**
 * Notifie le créateur d'un média modéré (story/short/live).
 * On cherche le business owner via la relation du média.
 */
export async function notifyMediaModerated(params: {
  target: MediaTarget;
  status: 'approved' | 'rejected';
  reason?: string;
}): Promise<void> {
  try {
    let businessId: string | undefined;
    if (params.target.kind === 'story') {
      businessId = (
        await prisma.story.findUnique({
          where: { id: params.target.id },
          select: { businessId: true },
        })
      )?.businessId;
    } else if (params.target.kind === 'short') {
      businessId = (
        await prisma.short.findUnique({
          where: { id: params.target.id },
          select: { businessId: true },
        })
      )?.businessId;
    } else {
      businessId = (
        await prisma.live.findUnique({
          where: { id: params.target.id },
          select: { businessId: true },
        })
      )?.businessId;
    }
    if (!businessId) return;
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });
    if (!business) return;
    // On réutilise le canal SECURITY_ALERT pour un message de modération clair.
    publishSecurityAlert({
      userId: business.ownerId,
      device: 'Modération',
      location: params.status === 'approved'
        ? `Votre ${params.target.kind} a été approuvé ✅`
        : `Votre ${params.target.kind} a été refusé ❌${params.reason ? ' (' + params.reason + ')' : ''}`,
    });
  } catch (err) {
    logger.warn(`[admin] notifyMediaModerated échoué`, { error: (err as Error).message });
  }
}

export { getModuleOwnerUserId };
