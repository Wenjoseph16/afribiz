import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findFirst({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

export async function listTemplates(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.whatsAppTemplate.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTemplate(
  ownerId: string,
  data: {
    name: string;
    category: string;
    language: string;
    body: string;
    header?: string;
    footer?: string;
    buttons?: any;
  }
) {
  const businessId = await getBusinessId(ownerId);
  return prisma.whatsAppTemplate.create({ data: { businessId, ...data } as any });
}

export async function updateTemplate(ownerId: string, id: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.whatsAppTemplate.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Template non trouvé', 404);
  return prisma.whatsAppTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.whatsAppTemplate.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Template non trouvé', 404);
  return prisma.whatsAppTemplate.delete({ where: { id } });
}

export async function listSessions(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.whatsAppSession.findMany({
    where: { businessId },
    include: { _count: { select: { messages: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getSessionMessages(ownerId: string, sessionId: string) {
  const businessId = await getBusinessId(ownerId);
  const session = await prisma.whatsAppSession.findFirst({ where: { id: sessionId, businessId } });
  if (!session) throw new AppError('Session non trouvée', 404);
  return prisma.whatsAppMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
}

export async function sendMessage(
  ownerId: string,
  data: { sessionId: string; content: string; contentType?: string; mediaUrl?: string }
) {
  const businessId = await getBusinessId(ownerId);
  const session = await prisma.whatsAppSession.findFirst({
    where: { id: data.sessionId, businessId },
  });
  if (!session) throw new AppError('Session non trouvée', 404);
  return prisma.whatsAppMessage.create({
    data: {
      sessionId: data.sessionId,
      content: data.content,
      mediaUrl: data.mediaUrl || null,
      messageType: data.contentType || 'text',
      fromBusiness: true,
      status: 'sent',
    },
  });
}

export async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  parameters: Record<string, string>
) {
  const apiVersion = process.env.FACEBOOK_API_VERSION || 'v21.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    logger.warn(
      '[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN not configured — message logged only'
    );
    return { success: true, simulated: true };
  }

  const components: any[] = [];
  if (parameters && Object.keys(parameters).length > 0) {
    const paramsArray = Object.entries(parameters).map(([_key, value]) => ({
      type: 'text',
      text: value,
    }));
    components.push({
      type: 'body',
      parameters: paramsArray,
    });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'fr' },
          components,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      logger.error(`[WhatsApp] Meta API error (${res.status}): ${errBody}`);
      return { success: false, error: `Meta API error: ${res.status}` };
    }

    const result = await res.json();
    return { success: true, messageId: result.messages?.[0]?.id || `fb_${Date.now()}` };
  } catch (err: any) {
    logger.error('[WhatsApp] Meta API call failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function getWhatsAppStats(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const [totalSessions, totalMessages, templatesCount] = await Promise.all([
    prisma.whatsAppSession.count({ where: { businessId } }),
    prisma.whatsAppMessage.count({ where: { session: { businessId } } }),
    prisma.whatsAppTemplate.count({ where: { businessId } }),
  ]);
  return { totalSessions, totalMessages, templatesCount };
}
