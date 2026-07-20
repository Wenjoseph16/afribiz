import { mockPrisma } from '../setup';
import {
  listPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerStats,
  getPublicPartners,
  listContracts,
  createContract,
  updateContract,
  signContract,
  listTransactions,
  createTransaction,
  listAssignments,
  createAssignment,
  updateAssignment,
  listReviews,
  createReview,
  listDocuments,
  createDocument,
  deleteDocument,
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getPartnerAnalytics,
} from '../../services/partner';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'b1' };
const mockPartner = {
  id: 'part-1',
  businessId: 'b1',
  name: 'Partenaire',
  category: 'FOURNISSEUR',
  isActive: true,
  score: 80,
  verifiedAt: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Partner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
  });

  test('listPartners returns paginated', async () => {
    jest.spyOn(mockPrisma.partner, 'findMany').mockResolvedValue([mockPartner as any]);
    jest.spyOn(mockPrisma.partner, 'count').mockResolvedValue(1);
    const r = await listPartners('owner-1');
    expect(r.data).toHaveLength(1);
  });

  test('getPartner returns with relations', async () => {
    jest.spyOn(mockPrisma.partner, 'findFirst').mockResolvedValue({
      ...mockPartner,
      contracts: [],
      transactions: [],
      assignments: [],
      reviews: [],
      documents: [],
      permissions: [],
    } as any);
    const r = await getPartner('owner-1', 'part-1');
    expect(r?.id).toBe('part-1');
  });

  test('createPartner creates', async () => {
    jest.spyOn(mockPrisma.partner, 'create').mockResolvedValue(mockPartner as any);
    const r = await createPartner('owner-1', { name: 'Partenaire', category: 'FOURNISSEUR' });
    expect(r.name).toBe('Partenaire');
  });

  test('updatePartner updates existing', async () => {
    jest.spyOn(mockPrisma.partner, 'findFirst').mockResolvedValue(mockPartner as any);
    jest
      .spyOn(mockPrisma.partner, 'update')
      .mockResolvedValue({ ...mockPartner, name: 'Updated' } as any);
    const r = await updatePartner('owner-1', 'part-1', { name: 'Updated' });
    expect(r.name).toBe('Updated');
  });

  test('deletePartner soft-deletes', async () => {
    jest.spyOn(mockPrisma.partner, 'findFirst').mockResolvedValue(mockPartner as any);
    jest
      .spyOn(mockPrisma.partner, 'update')
      .mockResolvedValue({ ...mockPartner, isActive: false } as any);
    await expect(deletePartner('owner-1', 'part-1')).resolves.not.toThrow();
  });

  test('getPartnerStats returns stats', async () => {
    jest.spyOn(mockPrisma.partner, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.partnerContract, 'count').mockResolvedValue(3);
    jest
      .spyOn(mockPrisma.partnerTransaction, 'aggregate')
      .mockResolvedValue({ _sum: { amount: 1000 } } as any);
    jest.spyOn(mockPrisma.partner, 'aggregate').mockResolvedValue({ _avg: { score: 80 } } as any);
    jest.spyOn(mockPrisma.partnerAssignment, 'count').mockResolvedValue(2);
    const r = await getPartnerStats('owner-1');
    expect(r.total).toBe(5);
    expect(r.revenusGeneres).toBe(1000);
  });

  test('getPublicPartners returns active', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
    jest.spyOn(mockPrisma.partner, 'findMany').mockResolvedValue([mockPartner as any]);
    const r = await getPublicPartners('biz-slug');
    expect(r).toHaveLength(1);
  });

  test('listContracts returns contracts', async () => {
    jest.spyOn(mockPrisma.partnerContract, 'findMany').mockResolvedValue([
      {
        id: 'ct-1',
        businessId: 'b1',
        partnerId: 'part-1',
        title: 'Contrat',
        status: 'ACTIF',
        partner: { id: 'part-1', name: 'Partenaire', logo: null },
      } as any,
    ]);
    const r = await listContracts('owner-1');
    expect(r).toHaveLength(1);
  });

  test('createContract creates', async () => {
    jest.spyOn(mockPrisma.partnerContract, 'create').mockResolvedValue({
      id: 'ct-1',
      businessId: 'b1',
      partnerId: 'part-1',
      title: 'Contrat',
    } as any);
    const r = await createContract('owner-1', { partnerId: 'part-1', title: 'Contrat' });
    expect(r.title).toBe('Contrat');
  });

  test('createReview creates and updates partner score', async () => {
    jest
      .spyOn(mockPrisma.partnerReview, 'create')
      .mockResolvedValue({ id: 'rev-1', businessId: 'b1', partnerId: 'part-1', rating: 4 } as any);
    jest
      .spyOn(mockPrisma.partnerReview, 'aggregate')
      .mockResolvedValue({ _avg: { rating: 4 } } as any);
    jest.spyOn(mockPrisma.partner, 'update').mockResolvedValue(mockPartner as any);
    const r = await createReview('owner-1', { partnerId: 'part-1', rating: 4 });
    expect(r.rating).toBe(4);
  });

  test('getPartnerAnalytics returns analytics', async () => {
    jest.spyOn(mockPrisma.partner, 'findMany').mockResolvedValue([mockPartner as any]);
    jest
      .spyOn(mockPrisma.partner, 'groupBy')
      .mockResolvedValue([{ category: 'FOURNISSEUR', _count: 5, _avg: { score: 80 } } as any]);
    jest.spyOn(mockPrisma.partnerTransaction, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.partnerContract, 'count').mockResolvedValue(2);
    const r = await getPartnerAnalytics('owner-1');
    expect(r.topPartners).toHaveLength(1);
    expect(r.contratsExpirant).toBe(2);
  });

  test('createTransaction creates', async () => {
    jest.spyOn(mockPrisma.partnerTransaction, 'create').mockResolvedValue({
      id: 'tx-1',
      businessId: 'b1',
      partnerId: 'part-1',
      amount: 5000,
      type: 'PAIEMENT',
    } as any);
    const r = await createTransaction('owner-1', {
      partnerId: 'part-1',
      amount: 5000,
      type: 'PAIEMENT',
    });
    expect(r.amount).toBe(5000);
  });

  test('createAssignment creates', async () => {
    jest.spyOn(mockPrisma.partnerAssignment, 'create').mockResolvedValue({
      id: 'as-1',
      businessId: 'b1',
      partnerId: 'part-1',
      title: 'Mission',
    } as any);
    const r = await createAssignment('owner-1', { partnerId: 'part-1', title: 'Mission' });
    expect((r as any).title).toBe('Mission');
  });
});
