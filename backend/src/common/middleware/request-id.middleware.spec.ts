import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockReq: Record<string, unknown>;
  let mockRes: { setHeader: jest.Mock };
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('should generate a UUID when no X-Request-Id header is present', () => {
    middleware.use(mockReq as any, mockRes as any, mockNext);

    expect(mockReq['id']).toBeDefined();
    expect(typeof mockReq['id']).toBe('string');
    // UUID v4 pattern: 8-4-4-4-12 hex chars
    expect(mockReq['id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('should reuse the client-provided X-Request-Id header', () => {
    mockReq['headers'] = { 'x-request-id': 'client-request-123' };

    middleware.use(mockReq as any, mockRes as any, mockNext);

    expect(mockReq['id']).toBe('client-request-123');
  });

  it('should set X-Request-Id on the response', () => {
    middleware.use(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      mockReq['id'],
    );
  });

  it('should call next()', () => {
    middleware.use(mockReq as any, mockRes as any, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
