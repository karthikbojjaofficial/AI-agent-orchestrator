import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the rateLimiter module
vi.mock('../../../services/rateLimiter.js', () => ({
  checkRateLimit: vi.fn(),
  getResetTime: vi.fn(),
}));

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow request when rate limit not exceeded', async () => {
    const { checkRateLimit } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(true);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => 'user_1'),
      req: {
        header: vi.fn(),
      },
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should block request when rate limit exceeded', async () => {
    const { checkRateLimit, getResetTime } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(false);
    vi.mocked(getResetTime).mockReturnValue(45);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => 'user_1'),
      req: {
        header: vi.fn(),
      },
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Rate limit exceeded. Please try again later.' },
      429,
      { 'Retry-After': '45' }
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should use userId as identifier when available', async () => {
    const { checkRateLimit } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(true);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => 'user_1'),
      req: {
        header: vi.fn(),
      },
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(checkRateLimit).toHaveBeenCalledWith('user_1');
  });

  it('should fall back to IP when userId not available', async () => {
    const { checkRateLimit } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(true);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => undefined),
      req: {
        header: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1';
          return undefined;
        }),
      },
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(checkRateLimit).toHaveBeenCalledWith('192.168.1.1');
  });

  it('should use x-real-ip header when x-forwarded-for not available', async () => {
    const { checkRateLimit } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(true);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => undefined),
      req: {
        header: vi.fn((name: string) => {
          if (name === 'x-real-ip') return '10.0.0.1';
          return undefined;
        }),
      },
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(checkRateLimit).toHaveBeenCalledWith('10.0.0.1');
  });

  it('should use "unknown" when no identifier available', async () => {
    const { checkRateLimit } = await import('../../../services/rateLimiter.js');
    vi.mocked(checkRateLimit).mockReturnValue(true);

    const { rateLimitMiddleware } = await import('../../../middleware/rateLimitMiddleware.js');

    const mockContext = {
      get: vi.fn(() => undefined),
      req: {
        header: vi.fn(() => undefined),
      },
    };
    const mockNext = vi.fn();

    await rateLimitMiddleware(mockContext as any, mockNext);

    expect(checkRateLimit).toHaveBeenCalledWith('unknown');
  });
});
