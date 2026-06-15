import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { DeveloperRepository } from '../repositories/developerRepository';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function generateApiKey(): string {
  return 'afb_dev_' + crypto.randomBytes(32).toString('hex');
}

function generateWebhookSecret(): string {
  return 'whsec_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Create a new API key for a developer
 */
export async function createApiKey(
  userId: string,
  data: { name: string; scopes?: string[]; expiresAt?: Date }
) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const key = generateApiKey();

  return (prisma as any).developerApiKey.create({
    data: {
      developerId: profile.id,
      name: data.name,
      key,
      scopes: data.scopes || [],
      expiresAt: data.expiresAt,
    },
  });
}

/**
 * Get all API keys for a developer
 */
export async function getApiKeys(userId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  return (prisma as any).developerApiKey.findMany({
    where: { developerId: profile.id },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(userId: string, keyId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const key = await (prisma as any).developerApiKey.findFirst({
    where: { id: keyId, developerId: profile.id },
  });
  if (!key) throw new AppError('Clé API non trouvée', 404);

  return (prisma as any).developerApiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });
}

// ============================================
// WEBHOOK MANAGEMENT
// ============================================

/**
 * Create a webhook
 */
export async function createWebhook(
  userId: string,
  data: {
    url: string;
    events: string[];
    moduleId?: string;
  }
) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const secret = generateWebhookSecret();

  return (prisma as any).moduleWebhook.create({
    data: {
      developerId: profile.id,
      moduleId: data.moduleId,
      url: data.url,
      secret,
      events: data.events,
    },
  });
}

/**
 * Get all webhooks for a developer
 */
export async function getWebhooks(userId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  return (prisma as any).moduleWebhook.findMany({
    where: { developerId: profile.id },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(userId: string, webhookId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const webhook = await (prisma as any).moduleWebhook.findFirst({
    where: { id: webhookId, developerId: profile.id },
  });
  if (!webhook) throw new AppError('Webhook non trouvé', 404);

  await (prisma as any).moduleWebhook.delete({ where: { id: webhookId } });
  return { success: true };
}

/**
 * Trigger a webhook event
 */
export async function triggerWebhookEvent(
  event: string,
  payload: any,
  moduleId?: string,
  developerId?: string
) {
  const where: any = { isActive: true, events: { has: event } };
  if (moduleId) where.moduleId = moduleId;
  if (developerId) where.developerId = developerId;

  const webhooks = await (prisma as any).moduleWebhook.findMany({ where });

  for (const webhook of webhooks) {
    await (prisma as any).webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload,
        status: 'PENDING',
      },
    });
  }

  return { triggered: webhooks.length };
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveries(webhookId: string, limit: number = 20) {
  return (prisma as any).webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
