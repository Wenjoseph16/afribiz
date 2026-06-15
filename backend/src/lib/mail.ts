import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

// ============================================
// Mail Service
// Primary: SendGrid (via @sendgrid/mail)
// Fallback: SMTP/Nodemailer
// Dev: Logs only
// ============================================

let transporter: Transporter;
let sendgridClient: any = null;
let sendgridInitialized = false;

async function getSendGridClient() {
  if (!sendgridInitialized && config.SENDGRID_API_KEY) {
    try {
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(config.SENDGRID_API_KEY);
      sendgridClient = sgMail;
      sendgridInitialized = true;
      logger.info('📧 SendGrid initialisé');
    } catch (err) {
      logger.warn(`⚠️ SendGrid non disponible: ${(err as Error).message}. Fallback SMTP.`);
      sendgridInitialized = true; // Don't retry on every send
    }
  }
  return sendgridClient;
}

const initializeMailer = () => {
  if (!config.SMTP_HOST) return;
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.NODE_ENV === 'production',
    auth: config.SMTP_USER && config.SMTP_PASS ? {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    } : undefined,
  });
};

/**
 * Send email — tries SendGrid first, falls back to SMTP, logs in dev
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // Dev mode: log only
  if (config.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    logger.info(`[DEV EMAIL] Body preview: ${html.substring(0, 200)}...`);
    return;
  }

  // Production: try SendGrid first
  const sg = await getSendGridClient();
  if (sg) {
    try {
      await sg.send({
        to,
        from: { email: config.SMTP_FROM, name: config.SMTP_FROM_NAME },
        subject,
        html,
      });
      logger.info(`📧 Email sent via SendGrid to ${to}`);
      return;
    } catch (err) {
      logger.error(`📧 SendGrid failed for ${to}, falling back to SMTP:`, (err as Error).message);
    }
  }

  // Fallback: SMTP via Nodemailer
  try {
    if (!transporter) initializeMailer();
    if (!transporter) {
      logger.warn(`📧 No SMTP configured, email to ${to} not sent`);
      return;
    }
    await transporter.sendMail({
      from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`📧 Email sent via SMTP to ${to}`);
  } catch (error) {
    logger.error(`📧 Failed to send email to ${to}:`, error);
    // Ne pas bloquer le flux utilisateur
  }
};

/**
 * Email templates — styled for African businesses
 */
export const emailTemplates = {
  welcome: (name: string, verificationLink: string) => ({
    subject: 'Bienvenue sur AfriBiz - Vérifiez votre email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2D8A5B, #1a6b3f); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #2D8A5B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Bienvenue sur AfriBiz ! 🎉</h1>
              </div>
              <div class="content">
                <p>Bonjour ${name},</p>
                <p>Merci de vous être inscrit sur AfriBiz. Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
                <p style="text-align: center;"><a href="${verificationLink}" class="button">Vérifier mon email</a></p>
                <p style="color: #666; font-size: 14px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Réinitialisation de mot de passe - AfriBiz',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2D8A5B, #1a6b3f); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #2D8A5B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Réinitialisation de mot de passe</h1>
              </div>
              <div class="content">
                <p>Bonjour ${name},</p>
                <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                <p style="text-align: center;"><a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a></p>
                <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
                <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  otp: (name: string, otp: string, type: string) => ({
    subject: 'Votre code de vérification AfriBiz',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #2D8A5B, #1a6b3f); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px; text-align: center; }
            .otp { font-size: 40px; font-weight: bold; letter-spacing: 6px; color: #2D8A5B; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Votre code de vérification</h1>
              </div>
              <div class="content">
                <p>Bonjour ${name},</p>
                <p>Votre code de vérification pour ${type} est :</p>
                <div class="otp">${otp}</div>
                <p style="color: #666; font-size: 14px;">Ce code expire dans 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
