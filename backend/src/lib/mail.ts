import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

let transporter: Transporter;

const initializeMailer = () => {
  if (!config.SMTP_HOST) return;
  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.NODE_ENV === 'production',
    auth:
      config.SMTP_USER && config.SMTP_PASS
        ? {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          }
        : undefined,
  });
};

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!config.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      logger.warn(`Resend failed (${res.status}): ${err}`);
      return false;
    }
    logger.info(`Email sent via Resend to ${to}`);
    return true;
  } catch (err) {
    logger.warn(`Resend error: ${(err as Error).message}`);
    return false;
  }
}

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (config.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    logger.info(`[DEV EMAIL] Body preview: ${html.substring(0, 200)}...`);
    return;
  }

  if (await sendViaResend(to, subject, html)) return;

  try {
    if (!transporter) initializeMailer();
    if (!transporter) {
      logger.warn(`No mail provider configured, email to ${to} not sent`);
      return;
    }
    await transporter.sendMail({
      from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent via SMTP to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
  }
};

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
                <h1>Bienvenue sur AfriBiz !</h1>
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

  notificationFailureAlert: (
    name: string,
    rate: number,
    failed: number,
    total: number,
    threshold: number
  ) => ({
    subject: `⚠️ Alerte: Taux d'échec notifications ${rate}% - AfriBiz`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; padding: 24px; }
            .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px; text-align: center; position: relative; }
            .header-icon { font-size: 48px; margin-bottom: 8px; }
            .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
            .header p { color: #fca5a5; margin: 8px 0 0; font-size: 14px; }
            .content { padding: 32px; }
            .stats-grid { display: flex; gap: 16px; margin: 24px 0; }
            .stat-card { flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: 800; color: #dc2626; }
            .stat-label { font-size: 12px; color: #991b1b; margin-top: 4px; font-weight: 500; }
            .progress-bar { background: #e5e7eb; border-radius: 8px; height: 12px; margin: 20px 0; overflow: hidden; }
            .progress-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg, #fca5a5, #dc2626); transition: width 0.5s; }
            .details { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: 600; color: #1f2937; }
            .btn { display: inline-block; background: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 8px 4px; }
            .btn-secondary { background: #1f2937; }
            .footer { text-align: center; padding: 24px 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .footer a { color: #dc2626; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="header-icon">&#9888;&#65039;</div>
                <h1>Alerte notifications</h1>
                <p>Taux d'échec critique détecté sur la plateforme</p>
              </div>
              <div class="content">
                <p>Bonjour <strong>${name}</strong>,</p>
                <p>Le taux d'échec de livraison des notifications push a dépassé le seuil critique.</p>
                
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${rate}%</div>
                    <div class="stat-label">Taux d'échec</div>
                  </div>
                  <div class="stat-card" style="background: #f0fdf4; border-color: #bbf7d0;">
                    <div class="stat-value" style="color: #16a34a;">${threshold}%</div>
                    <div class="stat-label" style="color: #166534;">Seuil autorisé</div>
                  </div>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(rate, 100)}%;"></div>
                </div>

                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Total livraisons (30 jours)</span>
                    <span class="detail-value">${total.toLocaleString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Échouées</span>
                    <span class="detail-value" style="color: #dc2626;">${failed.toLocaleString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Taux d'échec actuel</span>
                    <span class="detail-value" style="color: #dc2626;">${rate}%</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Seuil configuré</span>
                    <span class="detail-value">${threshold}%</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Dépassement</span>
                    <span class="detail-value" style="color: #dc2626;">+${(rate - threshold).toFixed(0)}%</span>
                  </div>
                </div>

                <p style="text-align: center; margin: 24px 0 0;">
                  <a href="https://afribiz.com/dashboard/admin/notification-analytics" class="btn">Voir les analyses</a>
                  <a href="https://afribiz.com/dashboard/admin/settings" class="btn btn-secondary">Configurer le seuil</a>
                </p>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement par AfriBiz.</p>
                <p>Consultez le tableau de bord admin pour plus de détails.</p>
                <p>&copy; ${new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
