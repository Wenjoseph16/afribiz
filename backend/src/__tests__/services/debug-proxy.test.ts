import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

test('$queryRawUnsafe mock works via assignment', async () => {
  (mockPrisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([{ total: 100 }]);
  const r = await (mockPrisma as any).$queryRawUnsafe('SELECT 1');
  expect(r).toEqual([{ total: 100 }]);
});
