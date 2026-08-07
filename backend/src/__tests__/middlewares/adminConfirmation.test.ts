import { requireAdminConfirmationInner } from '../../middlewares/adminConfirmation';
import { AppError } from '../../middlewares/errorHandler';
import { mockPrisma } from '../setup';

jest.mock('../../lib/password', () => ({
  hashPassword: jest.fn(),
  comparePasswords: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
// Le module réel exporte une CLASSE `TwoFactorService` — on remplace le mock du
// setup (qui exporte un objet sans la clé de classe) par la forme correcte.
jest.mock('../../services/twoFactorService', () => ({
  TwoFactorService: {
    generateSecret: jest.fn(),
    generateBackupCodes: jest.fn(),
    verifyAndEnable: jest.fn(),
    disable: jest.fn(),
    verifyToken: jest.fn().mockResolvedValue(true),
  },
}));

import { comparePasswords } from '../../lib/password';
import { TwoFactorService } from '../../services/twoFactorService';

const makeReq = (overrides: Record<string, any> = {}) => {
  return {
    user: { id: 'admin-1', email: 'admin@afribiz.com', primaryRole: 'ADMIN', roles: ['ADMIN'] },
    body: {},
    ...overrides,
  } as any;
};

describe('requireAdminConfirmationInner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
      twoFactorEnabled: false,
    });
  });

  it('bloque si aucun mot de passe fourni (CONFIRMATION_REQUIRED)', async () => {
    const next = jest.fn();
    const req = makeReq({ body: {} });
    await expect(requireAdminConfirmationInner(req, {} as any, next)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: 'CONFIRMATION_REQUIRED' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('valide un mot de passe correct sans 2FA et retire les champs du body', async () => {
    const next = jest.fn();
    const req = makeReq({ body: { adminPassword: 'Afribiz@2026!', action: 'suspend' } });
    await requireAdminConfirmationInner(req, {} as any, next);
    expect(comparePasswords).toHaveBeenCalledWith('Afribiz@2026!', 'hash');
    expect(next).toHaveBeenCalledTimes(1);
    // Les champs de confirmation sont retirés → le contrôleur reste inchangé
    expect(req.body.adminPassword).toBeUndefined();
    expect(req.body.otpCode).toBeUndefined();
    expect(req.body.action).toBe('suspend');
  });

  it('rejette un mot de passe invalide', async () => {
    (comparePasswords as jest.Mock).mockResolvedValueOnce(false);
    const next = jest.fn();
    const req = makeReq({ body: { adminPassword: 'mauvais' } });
    await expect(requireAdminConfirmationInner(req, {} as any, next)).rejects.toThrow(
      /Mot de passe invalide/
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('exige un code OTP quand la 2FA est activée (OTP_REQUIRED)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
      twoFactorEnabled: true,
    });
    const next = jest.fn();
    const req = makeReq({ body: { adminPassword: 'Afribiz@2026!' } });
    await expect(requireAdminConfirmationInner(req, {} as any, next)).rejects.toMatchObject({
      statusCode: 403,
      data: { code: 'OTP_REQUIRED' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepte mot de passe + OTP valide quand la 2FA est activée', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
      twoFactorEnabled: true,
    });
    (TwoFactorService.verifyToken as jest.Mock).mockResolvedValueOnce(true);
    const next = jest.fn();
    const req = makeReq({ body: { adminPassword: 'Afribiz@2026!', otpCode: '123456' } });
    await requireAdminConfirmationInner(req, {} as any, next);
    expect(TwoFactorService.verifyToken).toHaveBeenCalledWith('admin-1', '123456');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejette un OTP invalide quand la 2FA est activée', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      passwordHash: 'hash',
      twoFactorEnabled: true,
    });
    (TwoFactorService.verifyToken as jest.Mock).mockResolvedValueOnce(false);
    const next = jest.fn();
    const req = makeReq({ body: { adminPassword: 'Afribiz@2026!', otpCode: '000000' } });
    await expect(requireAdminConfirmationInner(req, {} as any, next)).rejects.toThrow(
      /2FA invalide/
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('verrouille après 5 échecs consécutifs (anti brute-force, 429)', async () => {
    // NB : le failureMap est partagé entre les tests du fichier — le test du mot de
    // passe invalide a déjà consommé 1 échec. On échoue 8 fois : le verrou s'active
    // dès que le compteur atteint 5, les tentatives suivantes renvoient 429.
    (comparePasswords as jest.Mock).mockResolvedValue(false);
    for (let i = 0; i < 8; i++) {
      const req = makeReq({ body: { adminPassword: 'mauvais' } });
      await expect(requireAdminConfirmationInner(req, {} as any, jest.fn())).rejects.toBeInstanceOf(
        AppError
      );
    }
    // Avec un bon mot de passe, le verrou bloque AVANT la vérification
    (comparePasswords as jest.Mock).mockClear();
    (comparePasswords as jest.Mock).mockResolvedValue(true);
    const req = makeReq({ body: { adminPassword: 'Afribiz@2026!' } });
    await expect(requireAdminConfirmationInner(req, {} as any, jest.fn())).rejects.toMatchObject({
      statusCode: 429,
    });
    expect(comparePasswords).not.toHaveBeenCalled();
  });
});
