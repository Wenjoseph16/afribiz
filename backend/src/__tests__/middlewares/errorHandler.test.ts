import { AppError, errorHandler, catchAsyncErrors } from '../../middlewares/errorHandler';

jest.mock('../../config/env', () => ({
  config: { NODE_ENV: 'development' },
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('AppError', () => {
  it('should set statusCode and isOperational', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('should default to status 500', () => {
    const err = new AppError('Server error');
    expect(err.statusCode).toBe(500);
  });

  it('should store optional data', () => {
    const err = new AppError('Validation failed', 400, { field: 'email' });
    expect(err.data).toEqual({ field: 'email' });
  });

  it('should capture stack trace', () => {
    const err = new AppError('Test error');
    expect(err.stack).toBeDefined();
  });
});

describe('errorHandler', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/test', user: { id: 'user-1' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should respond with 500 for unknown errors', () => {
    const err = new Error('Something broke');
    errorHandler(err, mockReq, mockRes, mockNext);

    const response = mockRes.json.mock.calls[0][0];
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(response.success).toBe(false);
    expect(response.error).toBe('Something broke');
    expect(response.stack).toBeDefined();
  });

  it('should respond with custom status for AppError', () => {
    const err = new AppError('Not found', 404);
    errorHandler(err, mockReq, mockRes, mockNext);

    const response = mockRes.json.mock.calls[0][0];
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(response.success).toBe(false);
    expect(response.error).toBe('Not found');
  });

  it('should include data when present', () => {
    const err = new AppError('Validation failed', 400, { field: 'email' });
    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      data: { field: 'email' },
    });
  });

  it('should hide internal details in production for 500 errors', async () => {
    jest.resetModules();
    jest.mock('../../config/env', () => ({
      config: { NODE_ENV: 'production' },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { errorHandler: prodHandler } = await import('../../middlewares/errorHandler');
    const err = new Error('Internal details');
    prodHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Erreur interne du serveur',
    });
  });
});

describe('catchAsyncErrors', () => {
  it('should call next with error when async fn rejects', async () => {
    const asyncFn = jest.fn().mockRejectedValue(new AppError('Async error', 400));
    const wrapped = catchAsyncErrors(asyncFn);
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();

    await wrapped(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should not call next when async fn resolves', async () => {
    const asyncFn = jest.fn().mockResolvedValue('ok');
    const wrapped = catchAsyncErrors(asyncFn);
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();

    await wrapped(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });
});
