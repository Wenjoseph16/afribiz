import { apiVersioning, apiDeprecationNotice } from '../../middlewares/apiVersion';

describe('apiVersioning middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
  });

  it('should set version headers', () => {
    apiVersioning(mockReq, mockRes, mockNext);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Supported-Versions', 'v1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should accept supported version', () => {
    mockReq.headers['accept-version'] = 'v1';
    apiVersioning(mockReq, mockRes, mockNext);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject unsupported version', () => {
    mockReq.headers['accept-version'] = 'v2';
    apiVersioning(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: "API version 'v2' not supported. Supported versions: v1",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('apiDeprecationNotice middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('should set deprecation headers with dates', () => {
    const middleware = apiDeprecationNotice('2025-01-01', '2025-06-01');
    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Deprecated-On', '2025-01-01');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Sunset-Date', '2025-06-01');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Deprecation-Warning', expect.any(String));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set deprecation headers without dates', () => {
    const middleware = apiDeprecationNotice();
    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.setHeader).not.toHaveBeenCalledWith('X-API-Deprecated-On', expect.any(String));
    expect(mockRes.setHeader).not.toHaveBeenCalledWith('X-API-Sunset-Date', expect.any(String));
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-API-Deprecation-Warning', expect.any(String));
    expect(mockNext).toHaveBeenCalled();
  });
});
