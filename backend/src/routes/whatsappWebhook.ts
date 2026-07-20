import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { config } from '../config/env';

const router = Router();

// Meta WhatsApp Cloud API webhook verification
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Verification failed');
});

// Receive incoming messages (with HMAC validation)
router.post('/webhook', async (req: Request, res: Response) => {
  // WhatsApp HMAC validation
  const signature = req.headers['x-hub-signature-256'] as string;
  const bodyStr = JSON.stringify(req.body);

  if (!signature) {
    logger.warn('WhatsApp webhook: signature manquante');
    return res.sendStatus(403);
  }

  const appSecret = process.env.WHATSAPP_TOKEN || '';
  if (appSecret) {
    const hmac = crypto.createHmac('sha256', appSecret).update(bodyStr).digest('hex');
    const expected = `sha256=${hmac}`;

    try {
      const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      if (!valid) {
        logger.warn('WhatsApp webhook: signature invalide');
        return res.sendStatus(403);
      }
    } catch {
      logger.warn('WhatsApp webhook: erreur validation signature');
      return res.sendStatus(403);
    }
  } else {
    logger.warn('WhatsApp webhook: WHATSAPP_TOKEN non configuré - validation HMAC désactivée');
  }

  const { entry } = req.body;

  if (!entry) return res.sendStatus(200);

  for (const e of entry) {
    if (!e.changes) continue;
    for (const change of e.changes) {
      if (!change.value?.messages) continue;

      const sessionPhone = change.value.messages[0]?.from;
      if (!sessionPhone) continue;

      let sessionId: string;
      const existing = await prisma.whatsAppSession.findFirst({
        where: { clientPhone: sessionPhone },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        sessionId = existing.id;
        await prisma.whatsAppSession.update({
          where: { id: sessionId },
          data: { lastMessageAt: new Date() },
        });
      } else {
        const session = await prisma.whatsAppSession
          .create({
            data: {
              businessId: '',
              clientPhone: sessionPhone,
              clientName: change.value.contacts?.[0]?.profile?.name || 'Contact',
              status: 'ACTIVE',
              lastMessageAt: new Date(),
            },
          })
          .catch(() => null);
        if (!session) continue;
        sessionId = session.id;
      }

      for (const message of change.value.messages) {
        const text = message.text?.body || '';
        const msgType = message.type;

        logger.info(`WhatsApp message from ${sessionPhone}: ${text}`);

        await prisma.whatsAppMessage
          .create({
            data: {
              sessionId,
              fromBusiness: false,
              content: text || null,
              messageType: msgType || 'text',
              waMessageId: message.id || null,
              status: 'received',
            },
          })
          .catch((err) => logger.warn('WhatsApp: failed to store message', { error: err.message }));
      }
    }
  }

  res.sendStatus(200);
});

// Send WhatsApp message endpoint (for business replies)
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { to, templateName, parameters } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({ success: false, error: 'to and templateName required' });
    }

    const result = await sendWhatsAppMessage(to, templateName, parameters || {});

    if (result.success) {
      res.json({ success: true, message: 'Message envoyé', messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error || 'Failed to send message' });
    }
  } catch {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
