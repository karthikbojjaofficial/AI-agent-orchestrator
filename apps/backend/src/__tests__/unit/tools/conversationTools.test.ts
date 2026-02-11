import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    conversation: {
      findMany: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('conversationTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queryConversationHistory', () => {
    it('should return all conversations for a user with messages', async () => {
      const mockConversations = [
        {
          title: 'Order Inquiry',
          createdAt: new Date('2024-01-15'),
          messages: [
            {
              role: 'user',
              content: 'Where is my order?',
              agentType: null,
            },
            {
              role: 'assistant',
              content: 'Your order is shipped',
              agentType: 'order',
            },
          ],
        },
        {
          title: 'Billing Question',
          createdAt: new Date('2024-01-10'),
          messages: [
            {
              role: 'user',
              content: 'Check my invoice',
              agentType: null,
            },
          ],
        },
      ];

      vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations as any);

      const { queryConversationHistory } = await import('../../../tools/conversationTools.js');
      const result = await queryConversationHistory('user_1');

      expect(result.conversations).toHaveLength(2);
      expect(result.conversations[0].title).toBe('Order Inquiry');
      expect(result.conversations[0].messages).toHaveLength(2);
      expect(result.conversations[1].messages).toHaveLength(1);
    });

    it('should return empty array when user has no conversations', async () => {
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const { queryConversationHistory } = await import('../../../tools/conversationTools.js');
      const result = await queryConversationHistory('user_1');

      expect(result.conversations).toEqual([]);
    });

    it('should order conversations by createdAt desc', async () => {
      const mockConversations = [
        {
          title: 'New Conv',
          createdAt: new Date('2024-01-20'),
          messages: [],
        },
        {
          title: 'Old Conv',
          createdAt: new Date('2024-01-10'),
          messages: [],
        },
      ];

      vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations as any);

      const { queryConversationHistory } = await import('../../../tools/conversationTools.js');
      await queryConversationHistory('user_1');

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_1' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
