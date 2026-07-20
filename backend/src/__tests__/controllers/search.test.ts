import { mockPrisma } from '../setup';

jest.mock('../../services/search', () => ({
  globalSearch: jest.fn(),
}));

import * as searchCtrl from '../../controllers/search';
import * as searchService from '../../services/search';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

const EMPTY_RESULT = {
  clients: [],
  orders: [],
  bookings: [],
  quotes: [],
  invoices: [],
  products: [],
  services: [],
  menuItems: [],
  debts: [],
  disputes: [],
  documents: [],
};

describe('search controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns results when query is provided', async () => {
    const mockData = { ...EMPTY_RESULT, products: [{ id: 'p1', name: 'Widget' }] };
    (searchService.globalSearch as jest.Mock).mockResolvedValue(mockData);

    const res = mockRes();
    const next = jest.fn();
    searchCtrl.searchAll(req({ query: { q: 'widget' } }), res, next);
    await flush();

    expect(searchService.globalSearch).toHaveBeenCalledWith('u1', 'widget');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  it('returns empty data when query is empty', async () => {
    const res = mockRes();
    const next = jest.fn();
    searchCtrl.searchAll(req({ query: { q: '' } }), res, next);
    await flush();

    expect(searchService.globalSearch).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: EMPTY_RESULT });
  });
});
