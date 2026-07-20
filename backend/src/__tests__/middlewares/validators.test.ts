import { validateBody, validateQuery, validatePagination } from '../../middlewares/validators';
import { z } from 'zod';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockRes = {} as any;

describe('validateBody', () => {
  it('should accept valid body', () => {
    const next = jest.fn();
    const req: any = { body: { name: 'John', email: 'john@test.com' } };
    validateBody(z.object({ name: z.string(), email: z.string().email() }))(req, mockRes, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error for invalid body', () => {
    const next = jest.fn();
    validateBody(z.object({ name: z.string().min(2) }))(
      { body: { name: 'J' } } as any,
      mockRes,
      next
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateQuery', () => {
  it('should handle valid query params', () => {
    const next = jest.fn();
    validateQuery(z.object({ page: z.string().optional() }))(
      { query: { page: '1' } } as any,
      mockRes,
      next
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validatePagination', () => {
  it('should set default page and limit', () => {
    const next = jest.fn();
    const req: any = { query: {} };
    validatePagination(req, mockRes, next);
    expect(req.query.page).toBe('1');
    expect(req.query.limit).toBe('10');
    expect(next).toHaveBeenCalled();
  });
});
