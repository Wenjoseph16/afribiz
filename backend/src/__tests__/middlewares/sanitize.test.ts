import { sanitizeInput } from '../../middlewares/sanitize';

describe('sanitizeInput middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should sanitize string values in body', () => {
    mockReq.body = { name: '<script>alert("xss")</script>Hello' };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body.name).not.toContain('<script>');
    expect(mockReq.body.name).toContain('Hello');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize nested objects in body', () => {
    mockReq.body = { user: { bio: '<img onerror="alert(1)" src=x>' } };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body.user.bio).not.toContain('onerror');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize arrays in body', () => {
    mockReq.body = { tags: ['<b>good</b>', '<script>bad</script>'] };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body.tags[0]).toBe('good');
    expect(mockReq.body.tags[1]).not.toContain('<script>');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize query parameters', () => {
    mockReq.query = { search: '<iframe src="http://evil.com">' };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.query.search).not.toContain('<iframe');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize params', () => {
    mockReq.params = { id: '<a href="javascript:alert(1)">' };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.params.id).not.toContain('javascript');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle non-object body gracefully', () => {
    mockReq.body = 'string body';
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body).toBe('string body');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle null body', () => {
    mockReq.body = null;
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body).toBeNull();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle numbers and booleans without modification', () => {
    mockReq.body = { count: 42, active: true, rate: 1.5 };
    sanitizeInput(mockReq, mockRes, mockNext);
    expect(mockReq.body.count).toBe(42);
    expect(mockReq.body.active).toBe(true);
    expect(mockReq.body.rate).toBe(1.5);
    expect(mockNext).toHaveBeenCalled();
  });
});
