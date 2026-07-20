import { mockPrisma } from '../setup';

jest.mock('../../services/partner', () => ({
  listPartners: jest.fn(),
  getPartner: jest.fn(),
  createPartner: jest.fn(),
  updatePartner: jest.fn(),
  deletePartner: jest.fn(),
  getPartnerStats: jest.fn(),
  getPublicPartners: jest.fn(),
  listContracts: jest.fn(),
  createContract: jest.fn(),
  updateContract: jest.fn(),
  signContract: jest.fn(),
  listTransactions: jest.fn(),
  createTransaction: jest.fn(),
  listAssignments: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  listReviews: jest.fn(),
  createReview: jest.fn(),
  listDocuments: jest.fn(),
  createDocument: jest.fn(),
  deleteDocument: jest.fn(),
  listPermissions: jest.fn(),
  createPermission: jest.fn(),
  updatePermission: jest.fn(),
  deletePermission: jest.fn(),
  getPartnerAnalytics: jest.fn(),
}));

import * as partnerCtrl from '../../controllers/partner';
import * as partnerService from '../../services/partner';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('partner controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listPartners', async () => {
    const data = { data: [{ id: 'p1', name: 'Partner' }], total: 1, page: 1, limit: 50 };
    (partnerService.listPartners as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const r = req({ query: { category: 'fournisseur' } });
    partnerCtrl.listPartners(r, res, jest.fn());
    await flush();
    expect(partnerService.listPartners).toHaveBeenCalledWith('u1', { category: 'fournisseur' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('createPartner returns 201', async () => {
    const partner = { id: 'p1', name: 'New Partner' };
    (partnerService.createPartner as jest.Mock).mockResolvedValue(partner);
    const res = mockRes();
    const r = req({ body: { name: 'New Partner' } });
    partnerCtrl.createPartner(r, res, jest.fn());
    await flush();
    expect(partnerService.createPartner).toHaveBeenCalledWith('u1', { name: 'New Partner' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: partner,
      message: 'Partenaire ajouté avec succès',
    });
  });

  it('getPartner returns 404 when service returns null', async () => {
    (partnerService.getPartner as jest.Mock).mockResolvedValue(null);
    const res = mockRes();
    const next = jest.fn();
    partnerCtrl.getPartner(req({ params: { id: 'nonexistent' } }), res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Partenaire non trouvé' })
    );
  });

  it('getPartner success', async () => {
    const partner = { id: 'p1', name: 'Partner', score: 80 };
    (partnerService.getPartner as jest.Mock).mockResolvedValue(partner);
    const res = mockRes();
    partnerCtrl.getPartner(req({ params: { id: 'p1' } }), res, jest.fn());
    await flush();
    expect(partnerService.getPartner).toHaveBeenCalledWith('u1', 'p1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: partner });
  });

  it('deletePartner returns success message', async () => {
    (partnerService.deletePartner as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    partnerCtrl.deletePartner(req({ params: { id: 'p1' } }), res, jest.fn());
    await flush();
    expect(partnerService.deletePartner).toHaveBeenCalledWith('u1', 'p1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Partenaire désactivé avec succès',
    });
  });
});
