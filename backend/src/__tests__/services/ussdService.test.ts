import { mockPrisma } from '../setup';
import { handleUssdSession } from '../../services/ussdService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('ussdService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleUssdSession', () => {
    it('should render main menu on empty text', async () => {
      jest.spyOn(mockPrisma.whatsAppSession, 'findFirst').mockResolvedValue({ id: 'sess-1' });
      jest.spyOn(mockPrisma.whatsAppSession, 'update').mockResolvedValue({} as any);
      const r = await handleUssdSession('22890000000', '');
      expect(r).toContain('CON Menu principal');
      expect(r).toContain('Consulter mon solde');
      expect(r).toContain('Quitter');
    });

    it('should handle exit (input 0)', async () => {
      const r = await handleUssdSession('22890000000', '0');
      expect(r).toContain('END');
      expect(r).toContain('Merci');
    });

    it('should handle balance action', async () => {
      const r = await handleUssdSession('22890000000', '1');
      expect(r).toContain('END');
      expect(r).toContain('solde');
    });

    it('should navigate to submenu', async () => {
      const r = await handleUssdSession('22890000000', '2');
      expect(r).toContain('CON Mes commandes');
      expect(r).toContain('Dernière commande');
    });

    it('should handle nested submenu action', async () => {
      const r = await handleUssdSession('22890000000', '2*1');
      expect(r).toContain('END');
      expect(r).toContain('dernière commande');
    });

    it('should return invalid input for non-numeric', async () => {
      const r = await handleUssdSession('22890000000', 'abc');
      expect(r).toContain('CON');
      expect(r).toContain('invalide');
    });

    it('should return invalid option for out of range', async () => {
      const r = await handleUssdSession('22890000000', '99');
      expect(r).toContain('CON');
      expect(r).toContain('invalide');
    });

    it('should handle support action', async () => {
      const r = await handleUssdSession('22890000000', '4');
      expect(r).toContain('support@afribiz.com');
    });

    it('should catch errors and return error message', async () => {
      jest.spyOn(mockPrisma.whatsAppSession, 'findFirst').mockRejectedValue(new Error('DB error'));
      const r = await handleUssdSession('22890000000', '');
      expect(r).toContain('END');
      expect(r).toContain('erreur');
    });
  });
});
