import { describe, it, expect, vi } from 'vitest';
import { extractUserId } from '../../../middleware/userMiddleware.js';

describe('userMiddleware', () => {
  describe('extractUserId', () => {
    it('should extract userId from x-user-id header', async () => {
      const mockContext = {
        req: {
          header: vi.fn((name: string) => {
            if (name === 'x-user-id') return 'user_1';
            return undefined;
          }),
        },
        set: vi.fn(),
      };

      const mockNext = vi.fn();

      await extractUserId(mockContext as any, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', 'user_1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing x-user-id header', async () => {
      const mockContext = {
        req: {
          header: vi.fn(() => undefined),
        },
        set: vi.fn(),
      };

      const mockNext = vi.fn();

      await extractUserId(mockContext as any, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', undefined);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract different user IDs correctly', async () => {
      const mockContext = {
        req: {
          header: vi.fn(() => 'user_2'),
        },
        set: vi.fn(),
      };

      const mockNext = vi.fn();

      await extractUserId(mockContext as any, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('userId', 'user_2');
    });
  });
});
