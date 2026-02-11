import { describe, it, expect, vi } from 'vitest';
import { validateUser } from '../../../middleware/validateUser.js';

describe('validateUser', () => {
  it('should allow valid user_1', async () => {
    const mockContext = {
      get: vi.fn(() => 'user_1'),
    };
    const mockNext = vi.fn();

    await validateUser(mockContext as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow valid user_2', async () => {
    const mockContext = {
      get: vi.fn(() => 'user_2'),
    };
    const mockNext = vi.fn();

    await validateUser(mockContext as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow valid user_3', async () => {
    const mockContext = {
      get: vi.fn(() => 'user_3'),
    };
    const mockNext = vi.fn();

    await validateUser(mockContext as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject missing userId', async () => {
    const mockContext = {
      get: vi.fn(() => undefined),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const result = await validateUser(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Missing x-user-id header' },
      400
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject invalid userId', async () => {
    const mockContext = {
      get: vi.fn(() => 'user_4'),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await validateUser(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Invalid user ID' },
      400
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject random string as userId', async () => {
    const mockContext = {
      get: vi.fn(() => 'invalid_user'),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await validateUser(mockContext as any, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Invalid user ID' },
      400
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
