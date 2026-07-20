import { mockPrisma } from '../setup';
import {
  checkContent,
  autoFlag,
  checkAndFlagUserContent,
} from '../../services/autoModerationService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('autoModerationService', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('checkContent', () => {
    test('returns ALLOW for safe content', () => {
      expect(checkContent('Bonjour, comment allez-vous?')).toEqual({ action: 'ALLOW' });
    });

    test('returns BLOCK for scam content', () => {
      expect(checkContent('Achetez ce produit, pas une arnaque!')).toEqual({
        action: 'BLOCK',
        reason: 'Contenu interdit détecté',
      });
    });

    test('returns BLOCK for spam URL', () => {
      expect(checkContent('Visitez https://bit.ly/xyz')).toEqual({
        action: 'BLOCK',
        reason: 'Contenu interdit détecté',
      });
    });

    test('returns BLOCK for long number sequence', () => {
      expect(checkContent('Appelez 0612345678 maintenant')).toEqual({
        action: 'BLOCK',
        reason: 'Contenu interdit détecté',
      });
    });

    test('returns FLAG for hateful content', () => {
      expect(checkContent("C'est un discours de haine")).toEqual({
        action: 'FLAG',
        reason: 'Contenu sensible détecté',
      });
    });

    test('blocked patterns take priority over flag patterns', () => {
      expect(checkContent('arnaque et insulte')).toEqual({
        action: 'BLOCK',
        reason: 'Contenu interdit détecté',
      });
    });
  });

  describe('autoFlag', () => {
    test('returns null for allowed content', async () => {
      const r = await autoFlag('Bonjour', 'REVIEW', 'r1');
      expect(r).toBeNull();
    });

    test('creates report for blocked content', async () => {
      jest.spyOn(mockPrisma.contentReport, 'create').mockResolvedValue({ id: 'cr1' } as any);
      const r = await autoFlag('arnaque', 'REVIEW', 'r1');
      expect(r).not.toBeNull();
      expect(mockPrisma.contentReport.create).toHaveBeenCalled();
    });
  });

  describe('checkAndFlagUserContent', () => {
    test('creates warning and report for blocked content', async () => {
      jest.spyOn(mockPrisma.userWarning, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.contentReport, 'create').mockResolvedValue({ id: 'cr1' } as any);
      const r = await checkAndFlagUserContent('u1', 'arnaque', 'REVIEW', 'r1');
      expect(mockPrisma.userWarning.create).toHaveBeenCalled();
      expect(r).not.toBeNull();
    });

    test('returns null for allowed content', async () => {
      const r = await checkAndFlagUserContent('u1', 'Bonjour', 'REVIEW', 'r1');
      expect(r).toBeNull();
    });
  });
});
