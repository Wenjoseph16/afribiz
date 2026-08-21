import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { config } from '../config/env';
import { publishCampaignSent } from '../events/publishers';

// ── Birthday Campaign ──
export async function sendBirthdayCampaigns() {
  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth() + 1;

  // Find users whose birthday is today
  const users = await prisma.user.findMany({
    where: {
      birthDate: { not: null },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, firstName: true, email: true, phone: true, birthDate: true },
  });

  const birthdayUsers = users.filter((u) => {
    if (!u.birthDate) return false;
    const bd = new Date(u.birthDate);
    return bd.getDate() === today && bd.getMonth() + 1 === month;
  });

  if (birthdayUsers.length === 0) return { sent: 0 };

  // Find businesses these users have ordered from
  const affectedBusinessIds = new Set<string>();
  let sent = 0;
  for (const user of birthdayUsers) {
    const businesses = await prisma.order.findMany({
      where: { buyerId: user.id },
      select: { businessId: true },
      distinct: ['businessId'],
    });

    for (const { businessId } of businesses) {
      if (businessId) affectedBusinessIds.add(businessId);
      // Create notification for birthday
      await prisma.notification.create({
        data: {
          userId: user.id,
          businessId,
          type: NotificationType.PROMOTION,
          title: 'Joyeux anniversaire !',
          description: `Nous vous offrons un cadeau spécial pour votre anniversaire.`,
          link: '/dashboard/promotions',
        } as any,
      });
      sent++;
    }
  }

  // Un événement CAMPAIGN_SENT par business concerné (pas de doublon par client)
  await publishCampaignSends(affectedBusinessIds, 'birthday');

  logger.info(`Birthday campaigns sent: ${sent}`);
  return { sent };
}

// ── Inactive Clients ──
export async function detectInactiveClients(daysInactive: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysInactive);

  // Find clients who haven't ordered in X days
  const inactiveClients = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      orders: {
        some: {},
        none: { createdAt: { gte: cutoff } },
      },
    },
    select: { id: true, firstName: true, email: true },
  });

  const affectedBusinessIds = new Set<string>();
  let sent = 0;
  for (const client of inactiveClients) {
    const businessOrders = await prisma.order.findMany({
      where: { buyerId: client.id },
      select: { businessId: true },
      distinct: ['businessId'],
    });

    for (const { businessId } of businessOrders) {
      if (businessId) affectedBusinessIds.add(businessId);
      await prisma.notification.create({
        data: {
          userId: client.id,
          businessId,
          type: NotificationType.PROMOTION,
          title: 'Vous nous manquez !',
          description: `Découvrez nos nouvelles offres spécialement pour vous.`,
          link: '/dashboard/marketplace',
        } as any,
      });
      sent++;
    }
  }

  // Un événement CAMPAIGN_SENT par business concerné
  await publishCampaignSends(affectedBusinessIds, 'inactive-reactivation');

  logger.info(`Inactive client reminders sent: ${sent}`);
  return { sent, totalInactive: inactiveClients.length };
}

// ── Event publishers (CAMPAIGN_SENT) ──
// Publie un événement par business concerné pour alimenter le tableau de bord
// marketing du propriétaire en temps réel (room business:{id}).
async function publishCampaignSends(businessIds: Set<string>, campaignId: string) {
  if (businessIds.size === 0) return;
  const owners = await prisma.business.findMany({
    where: { id: { in: [...businessIds] } },
    select: { id: true, ownerId: true },
  });
  for (const b of owners) {
    if (!b.ownerId) continue;
    try {
      await publishCampaignSent({
        userId: b.ownerId,
        businessId: b.id,
        campaignId,
        channel: 'IN_APP',
      });
    } catch (err) {
      logger.warn('Campaign event publish failed', { error: (err as Error).message });
    }
  }
}

// ── Envoi campagne via template WhatsApp (lien Marketing ↔ WhatsApp Business) ──
// Envoie le body d'un template WhatsApp à chaque client du business ayant un téléphone,
// crée (ou réutilise) une session WhatsApp par client + un message, met à jour la campagne.
export async function sendCampaignViaWhatsApp(
  ownerId: string,
  campaignId: string,
  templateId: string
) {
  const business = await prisma.business.findFirst({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, slug: true, phone: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: campaignId, businessId: business.id },
  });
  if (!campaign) throw new AppError('Campagne non trouvée', 404);
  if (campaign.status === 'COMPLETED') throw new AppError('Campagne déjà envoyée', 409);

  const template = await prisma.whatsAppTemplate.findFirst({
    where: { id: templateId, businessId: business.id },
  });
  if (!template) throw new AppError('Template WhatsApp non trouvé', 404);
  if (template.status !== 'APPROVED')
    throw new AppError('Le template doit être approuvé (APPROVED)', 400);

  // Clients du business avec un téléphone
  const clients = await prisma.businessClient.findMany({
    where: { businessId: business.id, phone: { not: null } },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });
  if (clients.length === 0) throw new AppError('Aucun client avec téléphone à contacter', 400);

  const interpolate = (
    body: string,
    c: { firstName: string | null; lastName: string | null; phone: string | null }
  ) =>
    body.replace(/\{\{(\d+)\}\}/g, (_, n: string) => {
      const idx = parseInt(n, 10);
      const values = [c.firstName || 'client', c.lastName || '', c.phone || '', business.name];
      return values[idx - 1] || '';
    });

  let sent = 0;
  for (const c of clients) {
    if (!c.phone) continue;
    // Session WhatsApp existante pour ce client ? sinon on la crée
    let session = await prisma.whatsAppSession.findFirst({
      where: { businessId: business.id, clientPhone: c.phone },
    });
    if (!session) {
      session = await prisma.whatsAppSession.create({
        data: {
          businessId: business.id,
          clientPhone: c.phone,
          clientName: c.firstName ? `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}` : null,
          status: 'ACTIVE',
        },
      });
    }
    // Lien de tracking public : un clic = ouverture + clic, puis redirection vers la page publique
    const trackLink = `${config.BACKEND_URL || 'http://localhost:3001'}/api/track/campaign/${campaign.id}?action=click&redirect=/business/${business.slug}`;
    await prisma.whatsAppMessage.create({
      data: {
        sessionId: session.id,
        fromBusiness: true,
        content: `${interpolate(template.body, c)}\n\n${trackLink}`,
        messageType: 'text',
        status: 'sent',
        metadata: { source: 'campaign', campaignId, templateId: template.id, trackLink },
      },
    });
    // Actualise la session
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date() },
    });
    sent++;
  }

  // Marque la campagne envoyée
  const updated = await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: { status: 'COMPLETED', sentAt: new Date(), sentCount: { increment: sent } },
  });

  try {
    await publishCampaignSent({
      userId: ownerId,
      businessId: business.id,
      campaignId: campaign.id,
      channel: 'WHATSAPP',
    });
  } catch (err) {
    logger.warn('Campaign event publish failed', { error: (err as Error).message });
  }

  logger.info(`Campaign ${campaign.id} sent via WhatsApp to ${sent} clients`);
  return { sent, totalClients: clients.length, campaign: updated, template: template.name };
}

// ── Campaign Stats ──
export async function getMarketingStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const [totalCampaigns, totalSent, activeCampaigns, birthdayToday] = await Promise.all([
    prisma.promotion.count({ where: { businessId: business.id } }),
    prisma.notification.count({
      where: { businessId: business.id, type: NotificationType.PROMOTION } as any,
    }),
    prisma.promotion.count({
      where: { businessId: business.id, isActive: true, endDate: { gte: new Date() } } as any,
    }),
    prisma.user.count({
      where: {
        isActive: true,
        birthDate: { not: null },
        orders: { some: { businessId: business.id } },
      },
    }),
  ]);

  return { totalCampaigns, totalSent, activeCampaigns, birthdayToday };
}
