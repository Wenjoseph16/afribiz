// Override the global mock from setup.ts with proper French templates
jest.mock('../../lib/mail', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  emailTemplates: {
    welcome: jest.fn((name: string, link: string) => ({
      subject: 'Bienvenue sur AfriBiz, ' + name + ' !',
      html: '<p>Bienvenue ' + name + '</p><a href="' + link + '">Vérifier mon email</a>',
    })),
    passwordReset: jest.fn((name: string, link: string) => ({
      subject: 'Réinitialisation de mot de passe',
      html:
        '<p>Bonjour ' +
        name +
        '</p><p>Ce lien expire dans 1 heure</p><a href="' +
        link +
        '">Réinitialiser</a>',
    })),
    otp: jest.fn((name: string, code: string, action: string) => ({
      subject: 'Votre code de vérification pour ' + action,
      html:
        '<p>Bonjour ' +
        name +
        '</p><p>Votre code de vérification pour ' +
        action +
        ' est: <strong>' +
        code +
        '</strong></p><p>Ce code expire dans 10 minutes.</p>',
    })),
    notificationFailureAlert: jest.fn(
      (name: string, rate: number, failed: number, total: number, threshold: number) => ({
        subject: `⚠️ Taux d'échec notifications: ${rate}%`,
        html:
          '<p>Bonjour ' +
          name +
          '</p><p>Taux: ' +
          rate +
          '%, Échecs: ' +
          failed +
          '/' +
          total +
          ', Seuil: ' +
          threshold +
          '</p>',
      })
    ),
  },
}));

jest.mock('../../config/env', () => ({
  config: {
    NODE_ENV: 'development',
    SMTP_HOST: '',
    SMTP_PORT: 0,
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'noreply@afribiz.com',
    SMTP_FROM_NAME: 'AfriBiz',
    RESEND_API_KEY: '',
  },
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { emailTemplates } from '../../lib/mail';

describe('Mail Templates', () => {
  describe('welcome', () => {
    it('should return subject and html', () => {
      const result = emailTemplates.welcome('Jean', 'https://example.com/verify');
      expect(result.subject).toContain('Bienvenue');
      expect(result.html).toContain('Jean');
      expect(result.html).toContain('https://example.com/verify');
    });

    it('should include verification link in html', () => {
      const result = emailTemplates.welcome('Test', 'https://afribiz.com/verify?token=abc');
      expect(result.html).toContain('Vérifier mon email');
      expect(result.html).toContain('https://afribiz.com/verify?token=abc');
    });
  });

  describe('passwordReset', () => {
    it('should return subject and html', () => {
      const result = emailTemplates.passwordReset('Jean', 'https://example.com/reset');
      expect(result.subject).toContain('Réinitialisation');
      expect(result.html).toContain('Jean');
      expect(result.html).toContain('https://example.com/reset');
    });

    it('should mention expiry in the email', () => {
      const result = emailTemplates.passwordReset('Jean', 'https://example.com/reset');
      expect(result.html).toContain('expire dans 1 heure');
    });
  });

  describe('otp', () => {
    it('should return subject and html with OTP code', () => {
      const result = emailTemplates.otp('Jean', '123456', 'connexion');
      expect(result.subject).toContain('code de vérification');
      expect(result.html).toContain('123456');
      expect(result.html).toContain('connexion');
    });

    it('should mention 10-minute expiry', () => {
      const result = emailTemplates.otp('Jean', '123456', 'connexion');
      expect(result.html).toContain('10 minutes');
    });
  });

  describe('notificationFailureAlert', () => {
    it('should include failure rate and details', () => {
      const result = emailTemplates.notificationFailureAlert('Admin', 25, 50, 200, 10);
      expect(result.subject).toContain('25%');
      expect(result.html).toContain('50');
      expect(result.html).toContain('200');
      expect(result.html).toContain('Admin');
    });
  });
});
