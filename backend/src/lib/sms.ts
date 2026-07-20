import { config } from '../config/env';
import { logger } from './logger';

/**
 * Send an SMS alert about high notification failure rate to an admin.
 *
 * In development mode, the SMS is logged to the console.
 * In production, it is dispatched to the configured SMS provider
 * (Twilio or AfriSMS).
 */
export async function sendFailureAlertSms(
  phone: string,
  rate: number,
  failed: number,
  total: number,
  threshold: number
): Promise<void> {
  const message = `⚠️ ALERTE AFRIBIZ: Taux d'échec notifications ${rate}% (${failed}/${total}) dépasse le seuil de ${threshold}%. Consultez le tableau de bord admin.`;

  if (config.NODE_ENV !== 'production') {
    logger.info(`[DEV SMS] To: ${phone}`);
    logger.info(`[DEV SMS] Body: ${message}`);
    return;
  }

  // Try Twilio first, fallback to AfriSMS
  if (await sendViaTwilio(phone, message)) return;
  if (await sendViaAfriSms(phone, message)) return;

  logger.warn(`SMS: no provider configured, SMS to ${phone} not sent`);
}

/**
 * Send an SMS via Twilio (ENV: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM).
 */
async function sendViaTwilio(phone: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

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
        body: new URLSearchParams({
          To: phone,
          From: from,
          Body: body,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      logger.warn(`Twilio SMS failed (${res.status}): ${err}`);
      return false;
    }

    logger.info(`SMS sent via Twilio to ${phone}`);
    return true;
  } catch (err) {
    logger.warn(`Twilio error: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Send an SMS via AfriSMS (ENV: AFRISMS_API_KEY, AFRISMS_SENDER).
 * AfriSMS is a pan-African SMS provider commonly used in Francophone Africa.
 */
async function sendViaAfriSms(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.AFRISMS_API_KEY;
  const sender = process.env.AFRISMS_SENDER || 'AFRIBIZ';

  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.afrisms.com/v2/send', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: phone,
        text: message,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.warn(`AfriSMS failed (${res.status}): ${err}`);
      return false;
    }

    logger.info(`SMS sent via AfriSMS to ${phone}`);
    return true;
  } catch (err) {
    logger.warn(`AfriSMS error: ${(err as Error).message}`);
    return false;
  }
}

/**
 * Send a generic SMS alert to admins.
 */
export async function sendAdminSms(phone: string, subject: string, body: string): Promise<void> {
  const fullBody = `[AfriBiz] ${subject}: ${body}`;

  if (config.NODE_ENV !== 'production') {
    logger.info(`[DEV SMS] To: ${phone} | Subject: ${subject}`);
    logger.info(`[DEV SMS] Body: ${fullBody}`);
    return;
  }

  if (await sendViaTwilio(phone, fullBody)) return;
  if (await sendViaAfriSms(phone, fullBody)) return;

  logger.warn(`SMS: no provider configured, SMS to ${phone} not sent`);
}
