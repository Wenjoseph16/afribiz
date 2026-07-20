import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishNewMessage: jest.fn() }));

import { partnerAuthMiddleware } from '../../middlewares/partnerAuth';

const mockRes = {} as any;
const activePartner = {
  id: 'p1',
  name: 'TestPartner',
  type: 'DATA_PROVIDER',
  slug: 'test-partner',
  isActive: true,
  apiEnabled: true,
  apiKey: 'key-123',
  apiQuota: 1000,
  apiUsed: 50,
  subscriptions: [{ status: 'ACTIVE' }],
};

async function flush() {
  await new Promise((r) => setTimeout(r, 10));
}

describe('partnerAuthMiddleware', () => {
  it('should call next with 401 if no API key', async () => {
    const next = jest.fn();
    partnerAuthMiddleware({ headers: {} } as any, mockRes, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should call next with 401 if invalid API key', async () => {
    const next = jest.fn();
    (mockPrisma.dataPartner.findUnique as jest.Mock).mockImplementation(() =>
      Promise.resolve(null)
    );
    partnerAuthMiddleware({ headers: { 'x-api-key': 'bad' } } as any, mockRes, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should succeed with valid partner', async () => {
    const next = jest.fn();
    const req: any = { headers: { 'x-api-key': 'key-123' } };
    (mockPrisma.dataPartner.findUnique as jest.Mock).mockImplementation(() =>
      Promise.resolve(activePartner)
    );
    (mockPrisma.dataPartner.update as jest.Mock).mockImplementation(() =>
      Promise.resolve(activePartner)
    );
    partnerAuthMiddleware(req, mockRes, next);
    await flush();
    expect(req.partner).toBeDefined();
    expect(req.partner.id).toBe('p1');
    expect(next).toHaveBeenCalled();
  });
});
