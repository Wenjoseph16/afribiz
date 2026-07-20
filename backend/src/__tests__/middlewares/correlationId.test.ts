import { correlationId } from '../../middlewares/correlationId';

describe('correlationId middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('should generate a correlation ID if not present in request', () => {
    correlationId(mockReq, mockRes, mockNext);
    expect(mockReq.headers['x-correlation-id']).toBeDefined();
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'X-Correlation-ID',
      mockReq.headers['x-correlation-id']
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reuse existing correlation ID from request header', () => {
    mockReq.headers['x-correlation-id'] = 'existing-id';
    correlationId(mockReq, mockRes, mockNext);
    expect(mockReq.headers['x-correlation-id']).toBe('existing-id');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'existing-id');
    expect(mockNext).toHaveBeenCalled();
  });
});
