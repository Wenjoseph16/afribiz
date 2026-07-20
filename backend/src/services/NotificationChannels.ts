import { config } from '../config/env';
import { logger } from '../lib/logger';
import { prisma } from '../lib/db';

export type SendMessageParams = {
  to: string;
  message: string;
  businessName?: string;
};

async function sendViaTwilio(to: string, body: string, fromNumber?: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = fromNumber || process.env.TWILIO_FROM;
  if (!accountSid || !authToken || !from) return false;
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      logger.warn(`Twilio failed (${res.status}): ${err}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.warn(`Twilio error: ${(err as Error).message}`);
    return false;
  }
}

export async function sendWhatsApp(params: SendMessageParams): Promise<void> {
  const { to, message, businessName } = params;
  if (config.NODE_ENV !== 'production') {
    logger.info(
      `[DEV WhatsApp] To: ${to} | ${businessName ? `Business: ${businessName} | ` : ''}${message.substring(0, 100)}`
    );
    return;
  }
  await sendViaTwilio(
    `whatsapp:${to}`,
    message,
    `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_FROM}`
  );
}

export async function sendSMS(params: SendMessageParams): Promise<void> {
  const { to, message, businessName } = params;
  if (config.NODE_ENV !== 'production') {
    logger.info(
      `[DEV SMS] To: ${to} | ${businessName ? `Business: ${businessName} | ` : ''}${message.substring(0, 100)}`
    );
    return;
  }
  if (await sendViaTwilio(to, message)) return;
  logger.warn(`SMS: Twilio not configured, SMS to ${to} not sent`);
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const webpush = await import('web-push').catch(() => null);
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@afribiz.com';

  if (!webpush || !vapidPublicKey || !vapidPrivateKey) {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV Push] To user ${userId}: ${title}: ${body.substring(0, 50)}`);
    }
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const payload = JSON.stringify({
    title,
    body,
    data: data || {},
    icon: '/logo.png',
    badge: '/badge.png',
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        logger.info('Push: subscription expired, removed');
      } else {
        logger.warn('Push: send failed', {
          userId,
          endpoint: sub.endpoint.substring(0, 30),
          error: err.message,
        });
      }
    }
  }
}

export async function sendSocialMediaMessage(params: {
  pageId: string;
  accessToken: string;
  recipientId: string;
  message: string;
}): Promise<void> {
  logger.info(
    `[Social] Page: ${params.pageId} -> ${params.recipientId}: ${params.message.substring(0, 50)}`
  );
}

export async function sendTikTokMessage(params: {
  openId: string;
  accessToken: string;
  message: string;
}): Promise<void> {
  logger.info(`[TikTok] ${params.openId}: ${params.message.substring(0, 50)}`);
}

export async function processDelivery(
  channel: string,
  to: string,
  message: string,
  businessName?: string
): Promise<boolean> {
  try {
    switch (channel) {
      case 'SMS':
        await sendSMS({ to, message, businessName });
        return true;
      case 'WHATSAPP':
        await sendWhatsApp({ to, message, businessName });
        return true;
      default:
        logger.info(`Channel ${channel} not implemented for outbound delivery`);
        return false;
    }
  } catch (err) {
    logger.error(`[${channel}] Delivery failed to ${to}:`, err);
    return false;
  }
}
