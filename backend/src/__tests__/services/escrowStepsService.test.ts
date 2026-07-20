import { mockPrisma } from '../setup';
import * as escrowSteps from '../../services/escrowStepsService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../events/publishers', () => ({
  publishEscrowCreated: jest.fn(),
  publishEscrowReleased: jest.fn(),
}));
jest.mock('../../services/wallet', () => ({
  getOrCreateWallet: jest.fn().mockResolvedValue({
    id: 'wal-1',
    businessId: 'biz-1',
    balance: 0,
    locked: 0,
    currency: 'FCFA',
  }),
}));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest
    .fn()
    .mockResolvedValue({ rate: 0.02, commission: 200, netAmount: 9800 }),
}));

const mockEscrow = {
  id: 'esc-1',
  businessId: 'biz-1',
  orderId: 'ord-1',
  amount: 10000,
  currency: 'FCFA',
  status: 'HELD',
  fee: 200,
  feeRate: 0.02,
  netAmount: 9800,
  releasedAt: null,
  notes: JSON.stringify({
    type: 'STEPPED',
    totalSteps: 3,
    currentStep: 0,
    steps: [
      { step: 1, description: 'Step 1', status: 'PENDING', releasedAt: null, amount: 3333.33 },
      { step: 2, description: 'Step 2', status: 'PENDING', releasedAt: null, amount: 3333.33 },
      { step: 3, description: 'Step 3', status: 'PENDING', releasedAt: null, amount: 3333.34 },
    ],
  }),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('escrowStepsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStepEscrow', () => {
    test('creates stepped escrow with commission log', async () => {
      (mockPrisma.escrow.create as jest.Mock).mockResolvedValue(mockEscrow);
      (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'fl-1' });
      const r = await escrowSteps.createStepEscrow({
        businessId: 'biz-1',
        orderId: 'ord-1',
        amount: 10000,
        totalSteps: 3,
        stepDescriptions: ['Step 1', 'Step 2', 'Step 3'],
      });
      expect(r.id).toBe('esc-1');
      expect(mockPrisma.financialLog.create).toHaveBeenCalled();
    });

    test('handles log failure gracefully', async () => {
      (mockPrisma.escrow.create as jest.Mock).mockResolvedValue(mockEscrow);
      (mockPrisma.financialLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));
      const r = await escrowSteps.createStepEscrow({
        businessId: 'biz-1',
        amount: 10000,
        totalSteps: 2,
        stepDescriptions: ['A', 'B'],
      });
      expect(r.id).toBe('esc-1');
    });
  });

  describe('releaseStep', () => {
    test('releases a single step', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(mockEscrow);
      (mockPrisma.escrow.update as jest.Mock).mockResolvedValue(mockEscrow);
      const r = await escrowSteps.releaseStep('esc-1', 'biz-1', 1);
      expect(r).toBeDefined();
    });

    test('releases all steps and credits wallet', async () => {
      const fullMock = {
        ...mockEscrow,
        notes: JSON.stringify({
          type: 'STEPPED',
          totalSteps: 1,
          currentStep: 0,
          steps: [
            {
              step: 1,
              description: 'Only step',
              status: 'PENDING',
              releasedAt: null,
              amount: 10000,
            },
          ],
        }),
      };
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(fullMock);
      (mockPrisma.escrow.update as jest.Mock).mockResolvedValue({
        ...fullMock,
        status: 'RELEASED',
        releasedAt: new Date(),
      });
      (mockPrisma.wallet.findUnique as jest.Mock).mockResolvedValue({
        id: 'wal-1',
        businessId: 'biz-1',
        balance: 5000,
        locked: 0,
      });
      (mockPrisma.walletTransaction.create as jest.Mock).mockResolvedValue({ id: 'wt-1' });
      (mockPrisma.$transaction as jest.Mock).mockImplementation((fn: (tx: any) => Promise<any>) =>
        fn(mockPrisma)
      );
      const r = await escrowSteps.releaseStep('esc-1', 'biz-1', 1);
      expect(r).toBeDefined();
    });

    test('throws if escrow not found', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(escrowSteps.releaseStep('bad-id', 'biz-1', 1)).rejects.toThrow(
        'Escrow non trouvé'
      );
    });

    test('throws if escrow not active', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue({
        ...mockEscrow,
        status: 'RELEASED',
      });
      await expect(escrowSteps.releaseStep('esc-1', 'biz-1', 1)).rejects.toThrow(
        'Escrow non actif'
      );
    });

    test('throws if previous steps not released', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(mockEscrow);
      await expect(escrowSteps.releaseStep('esc-1', 'biz-1', 2)).rejects.toThrow(
        'Les étapes précédentes doivent être libérées'
      );
    });

    test('throws if step already released', async () => {
      const releasedNotes = JSON.parse(JSON.stringify(JSON.parse(mockEscrow.notes)));
      releasedNotes.steps[0].status = 'RELEASED';
      const mockWithReleasedStep = { ...mockEscrow, notes: JSON.stringify(releasedNotes) };
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(mockWithReleasedStep);
      await expect(escrowSteps.releaseStep('esc-1', 'biz-1', 1)).rejects.toThrow(
        'Étape déjà libérée'
      );
    });
  });

  describe('getStepProgress', () => {
    test('returns step progress for stepped escrow', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(mockEscrow);
      const r = await escrowSteps.getStepProgress('esc-1', 'biz-1');
      expect(r.type).toBe('STEPPED');
      expect(r.totalSteps).toBe(3);
    });

    test('returns standard info for non-stepped escrow', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue({
        ...mockEscrow,
        notes: JSON.stringify({ type: 'STANDARD' }),
      });
      const r = await escrowSteps.getStepProgress('esc-1', 'biz-1');
      expect(r.type).toBe('STANDARD');
    });

    test('throws if escrow not found', async () => {
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(escrowSteps.getStepProgress('bad-id', 'biz-1')).rejects.toThrow(
        'Escrow non trouvé'
      );
    });
  });
});
