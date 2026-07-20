import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

let transporter: Transporter;

const initializeMailer = () => {
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

/**
 * Send email using configured SMTP
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    if (!transporter) {
      initializeMailer();
    }

    await transporter.sendMail({
      from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Email templates
 */
export const emailTemplates = {
  /**
   * Welcome email after signup
   */
  welcome: (name: string, verificationLink: string) => ({
    subject: 'Welcome to AfriBiz - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2D8A5B; padding: 20px; text-align: center; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #2D8A5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AfriBiz</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p><a href="${verificationLink}" class="button">Verify Email</a></p>
              <p>If you didn't sign up, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AfriBiz. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Password reset email
   */
  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password - AfriBiz',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2D8A5B; padding: 20px; text-align: center; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #2D8A5B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Password</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Click the button below to reset your password:</p>
              <p><a href="${resetLink}" class="button">Reset Password</a></p>
              <p>This link expires in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AfriBiz. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * OTP email for verification
   */
  otp: (name: string, otp: string, type: string) => ({
    subject: `Your AfriBiz Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2D8A5B; padding: 20px; text-align: center; }
            .header h1 { color: white; margin: 0; }
            .content { padding: 30px 20px; text-align: center; }
            .otp { font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #2D8A5B; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>Your verification code is:</p>
              <div class="otp">${otp}</div>
              <p>This code expires in ${config.OTP_EXPIRES_IN_MINUTES} minutes.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AfriBiz. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Notification failure rate alert to administrators
   */
  notificationFailureAlert: (
    name: string,
    rate: number,
    failed: number,
    total: number,
    threshold: number
  ) => ({
    subject: `⚠️ Alerte: Taux d'échec notifications ${rate}%`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; padding: 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 20px; }
            .content { padding: 30px 20px; }
            .stat-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center; }
            .stat-number { font-size: 36px; font-weight: bold; color: #DC2626; }
            .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Alerte : Taux d'échec notifications</h1>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Le taux d'échec de livraison des notifications a dépassé le seuil autorisé.</p>
              <div class="stat-box">
                <div class="stat-number">${rate}%</div>
                <div class="stat-label">Taux d'échec (seuil: ${threshold}%)</div>
              </div>
              <p><strong>Détails :</strong></p>
              <ul>
                <li>Notifications échouées : ${failed}</li>
                <li>Total notifications : ${total}</li>
                <li>Taux : ${rate}%</li>
                <li>Seuil : ${threshold}%</li>
              </ul>
              <p>Veuillez vérifier la configuration de vos canaux de notification.</p>
              <p><a href="${config.FRONTEND_URL}/admin/notification-analytics" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Voir les analyses</a></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AfriBiz. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};
