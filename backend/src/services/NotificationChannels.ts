import { logger } from '../lib/logger';

/**
 * NotificationChannels — envoi multicanal (WhatsApp, SMS, Push)
 *
 * Chaque méthode loggue l'envoi en dev et appelle le provider en production.
 * Les providers réels (Twilio, Vonage, Firebase) sont branchés ici
 * sans impacter le reste du système.
 */

export type SendMessageParams = {
  to: string;
  message: string;
  businessName?: string;
};

// ── WhatsApp ──
export async function sendWhatsApp(params: SendMessageParams): Promise<void> {
  const { to, message, businessName } = params;
  logger.info(`[WhatsApp] À: ${to} | Message: ${message.substring(0, 100)}${businessName ? ` | Business: ${businessName}` : ''}`);

  // TODO: Intégrer Twilio WhatsApp API ou WATI / GreenAPI
  // if (config.NODE_ENV === 'production') {
  //   await twilioClient.messages.create({ from: `whatsapp:${config.WHATSAPP_FROM}`, body: message, to: `whatsapp:${to}` });
  // }
}

// ── SMS ──
export async function sendSMS(params: SendMessageParams): Promise<void> {
  const { to, message, businessName } = params;
  logger.info(`[SMS] À: ${to} | Message: ${message.substring(0, 100)}${businessName ? ` | Business: ${businessName}` : ''}`);

  // TODO: Intégrer Twilio SMS ou Vonage / Africa's Talking
  // if (config.NODE_ENV === 'production') {
  //   await twilioClient.messages.create({ from: config.SMS_FROM, body: message, to });
  // }
}

// ── Push Notification (Firebase Cloud Messaging) ──
export async function sendPushNotification(params: {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const { deviceToken, title, body } = params;
  logger.info(`[Push] À: ${deviceToken.substring(0, 20)}... | ${title}: ${body.substring(0, 50)}`);

  // TODO: Intégrer Firebase Admin SDK
  // if (config.NODE_ENV === 'production') {
  //   await admin.messaging().send({ token: deviceToken, notification: { title, body }, data: params.data });
  // }
}

// ── Facebook / Instagram (via Meta Graph API) ──
export async function sendSocialMediaMessage(params: {
  pageId: string;
  accessToken: string;
  recipientId: string;
  message: string;
}): Promise<void> {
  logger.info(`[Social] Page: ${params.pageId} → ${params.recipientId}: ${params.message.substring(0, 50)}`);
  // TODO: Intégrer Meta Graph API
}

// ── TikTok Message ──
export async function sendTikTokMessage(params: {
  openId: string;
  accessToken: string;
  message: string;
}): Promise<void> {
  logger.info(`[TikTok] ${params.openId}: ${params.message.substring(0, 50)}`);
  // TODO: Intégrer TikTok Business API
}
