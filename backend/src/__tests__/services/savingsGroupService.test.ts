import { mockPrisma } from '../setup';
import * as savingsGroupService from '../../services/savingsGroupService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../services/fraudDetectionService', () => ({
  FraudDetectionService: {
    checkTransactionVelocity: jest.fn().mockResolvedValue({ blocked: false }),
  },
}));
jest.mock('../../services/wallet', () => ({
  getOrCreateWallet: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: 0 }),
}));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest
    .fn()
    .mockResolvedValue({ rate: 0.02, commission: 200, netAmount: 9800 }),
}));
jest.mock('../../events/publishers', () => ({
  publishSavingsCycleClosed: jest.fn(),
  publishSavingsContributionReceived: jest.fn(),
  publishSavingsLoanApproved: jest.fn(),
}));

const mockBusiness = {
  id: 'biz-1',
  ownerId: 'owner-1',
  name: 'Biz',
  verificationLevel: 'STANDARD',
};

describe('savingsGroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
  });

  describe('listSavingsGroups', () => {
    it('should list groups for owner', async () => {
      (mockPrisma.savingsGroup.findMany as jest.Mock).mockResolvedValue([]);
      const result = await savingsGroupService.listSavingsGroups('owner-1');
      expect(result).toEqual([]);
    });
  });

  describe('getSavingsGroup', () => {
    it('should return a group with details', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        members: [],
        cycles: [],
      });
      (mockPrisma.savingsLoan.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.savingsPayout.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);
      const result = await savingsGroupService.getSavingsGroup('owner-1', 'group-1');
      expect(result.id).toBe('group-1');
    });

    it('should throw if not found', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(savingsGroupService.getSavingsGroup('owner-1', 'invalid')).rejects.toThrow(
        'Groupe non trouvé'
      );
    });
  });

  describe('createSavingsGroup', () => {
    it('should create a group and admin member', async () => {
      (mockPrisma.savingsGroup.create as jest.Mock).mockResolvedValue({
        id: 'group-1',
        name: 'Test Group',
      });
      (mockPrisma.savingsMember.create as jest.Mock).mockResolvedValue({ id: 'member-1' });
      const result = await savingsGroupService.createSavingsGroup('owner-1', {
        name: 'Test Group',
      });
      expect(result.name).toBe('Test Group');
    });
  });

  describe('updateSavingsGroup', () => {
    it('should update an existing group', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        businessId: 'biz-1',
      });
      (mockPrisma.savingsGroup.update as jest.Mock).mockResolvedValue({
        id: 'group-1',
        name: 'Updated',
      });
      const result = await savingsGroupService.updateSavingsGroup('owner-1', 'group-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteSavingsGroup', () => {
    it('should cancel a group', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        businessId: 'biz-1',
      });
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.savingsGroup.update as jest.Mock).mockResolvedValue({
        id: 'group-1',
        status: 'CANCELLED',
      });
      await savingsGroupService.deleteSavingsGroup('owner-1', 'group-1');
      expect(mockPrisma.savingsGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } })
      );
    });
  });

  describe('addSavingsMember', () => {
    it('should add a member to active group', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        businessId: 'biz-1',
        status: 'ACTIVE',
      });
      (mockPrisma.savingsMember.create as jest.Mock).mockResolvedValue({
        id: 'member-1',
        name: 'John',
      });
      const result = await savingsGroupService.addSavingsMember('owner-1', {
        groupId: 'group-1',
        name: 'John',
      });
      expect(result.name).toBe('John');
    });
  });

  describe('removeSavingsMember', () => {
    it('should soft-remove a member', async () => {
      (mockPrisma.savingsMember.findFirst as jest.Mock).mockResolvedValue({ id: 'member-1' });
      (mockPrisma.savingsContribution.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.savingsLoan.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.savingsMember.update as jest.Mock).mockResolvedValue({
        id: 'member-1',
        isActive: false,
      });
      const result = await savingsGroupService.removeSavingsMember('owner-1', 'member-1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('getMemberScore', () => {
    it('should calculate member score', async () => {
      (mockPrisma.savingsMember.findFirst as jest.Mock).mockResolvedValue({
        id: 'member-1',
        reliabilityScore: 70,
      });
      (mockPrisma.savingsContribution.findMany as jest.Mock).mockResolvedValue([
        { status: 'PAID' },
        { status: 'PAID' },
      ]);
      (mockPrisma.savingsLoan.findMany as jest.Mock).mockResolvedValue([]);
      const result = await savingsGroupService.getMemberScore('owner-1', 'member-1');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('startSavingsCycle', () => {
    it('should start a new cycle', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        businessId: 'biz-1',
        status: 'ACTIVE',
      });
      (mockPrisma.savingsCycle.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.savingsMember.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.savingsCycle.create as jest.Mock).mockResolvedValue({
        id: 'cycle-1',
        cycleNumber: 1,
        status: 'ACTIVE',
      });
      const result = await savingsGroupService.startSavingsCycle('owner-1', 'group-1');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('recordContribution', () => {
    it('should record a contribution', async () => {
      (mockPrisma.savingsCycle.findFirst as jest.Mock).mockResolvedValue({
        id: 'cycle-1',
        status: 'ACTIVE',
        group: { id: 'group-1', businessId: 'biz-1', name: 'Group' },
      });
      (mockPrisma.savingsMember.findFirst as jest.Mock).mockResolvedValue({
        id: 'member-1',
        name: 'John',
        groupId: 'group-1',
        isActive: true,
      });
      (mockPrisma.savingsContribution.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.savingsContribution.create as jest.Mock).mockResolvedValue({
        id: 'contrib-1',
        amount: 5000,
      });
      (mockPrisma.savingsMember.update as jest.Mock).mockResolvedValue({});
      const result = await savingsGroupService.recordContribution('owner-1', {
        cycleId: 'cycle-1',
        memberId: 'member-1',
        amount: 5000,
      });
      expect(result.amount).toBe(5000);
    });
  });

  describe('createLoan', () => {
    it('should create a pending loan', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({
        id: 'group-1',
        businessId: 'biz-1',
        status: 'ACTIVE',
        members: [{ id: 'member-1', reliabilityScore: 80, totalContributed: 50000 }],
      });
      (mockPrisma.savingsLoan.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.savingsLoan.create as jest.Mock).mockResolvedValue({
        id: 'loan-1',
        amount: 10000,
        status: 'PENDING',
      });
      const result = await savingsGroupService.createLoan('owner-1', {
        groupId: 'group-1',
        memberId: 'member-1',
        amount: 10000,
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('approveLoan', () => {
    it('should approve a pending loan', async () => {
      (mockPrisma.savingsLoan.findFirst as jest.Mock).mockResolvedValue({
        id: 'loan-1',
        status: 'PENDING',
        reliabilityScore: 60,
        groupId: 'group-1',
        memberName: 'John',
        groupName: 'Group',
      });
      (mockPrisma.savingsLoan.update as jest.Mock).mockResolvedValue({
        id: 'loan-1',
        status: 'ACTIVE',
      });
      const result = await savingsGroupService.approveLoan('owner-1', 'loan-1');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('listLoans', () => {
    it('should list loans', async () => {
      (mockPrisma.savingsLoan.findMany as jest.Mock).mockResolvedValue([]);
      const result = await savingsGroupService.listLoans('owner-1');
      expect(result).toEqual([]);
    });
  });

  describe('getCyclePayoutStatus', () => {
    it('should return payout status', async () => {
      (mockPrisma.savingsCycle.findFirst as jest.Mock).mockResolvedValue({
        id: 'cycle-1',
        status: 'COMPLETED',
        releaseAt: new Date(),
        group: { id: 'group-1', name: 'Group', type: 'ROTATING' },
      });
      (mockPrisma.savingsPayout.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.savingsContribution.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await savingsGroupService.getCyclePayoutStatus('owner-1', 'cycle-1');
      expect(result.cycleId).toBe('cycle-1');
    });
  });

  describe('getGroupEscrows', () => {
    it('should return escrows for a group', async () => {
      (mockPrisma.savingsGroup.findFirst as jest.Mock).mockResolvedValue({ id: 'group-1' });
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);
      const result = await savingsGroupService.getGroupEscrows('owner-1', 'group-1');
      expect(result).toEqual([]);
    });
  });

  describe('getSavingsStats', () => {
    it('should return savings stats', async () => {
      (mockPrisma.savingsGroup.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.savingsMember.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.savingsContribution.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 100000 },
      });
      (mockPrisma.savingsLoan.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 50000 },
      });
      (mockPrisma.savingsCycle.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.savingsLoan.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.savingsContribution.findMany as jest.Mock).mockResolvedValue([
        { status: 'PAID' },
        { status: 'PAID' },
      ]);
      (mockPrisma.savingsMember.findMany as jest.Mock).mockResolvedValue([
        { reliabilityScore: 80 },
      ]);
      const result = await savingsGroupService.getSavingsStats('owner-1');
      expect(result.totalGroups).toBe(2);
      expect(result.totalMembers).toBe(10);
    });
  });
});
