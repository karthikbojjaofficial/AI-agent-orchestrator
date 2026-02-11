import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    conversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('conversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startNewConversation', () => {
    it('should create a new conversation with default title', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user_1',
        title: 'New Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation as any);

      const { startNewConversation } = await import('../../../services/conversationService.js');
      const result = await startNewConversation('user_1');

      expect(result.id).toBe('conv-123');
      expect(result.title).toBe('New Conversation');
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_1',
          title: 'New Conversation',
        },
      });
    });

    it('should create a new conversation with custom title', async () => {
      const mockConversation = {
        id: 'conv-456',
        userId: 'user_2',
        title: 'Order Inquiry',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation as any);

      const { startNewConversation } = await import('../../../services/conversationService.js');
      const result = await startNewConversation('user_2', 'Order Inquiry');

      expect(result.title).toBe('Order Inquiry');
      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_2',
          title: 'Order Inquiry',
        },
      });
    });
  });

  describe('loadConversationById', () => {
    it('should load conversation with messages', async () => {
      const mockConversation = {
        id: 'conv-123',
        userId: 'user_1',
        title: 'Test Conversation',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            agentType: null,
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there',
            agentType: 'support',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation as any);

      const { loadConversationById } = await import('../../../services/conversationService.js');
      const result = await loadConversationById('conv-123');

      expect(result?.id).toBe('conv-123');
      expect(result?.messages).toHaveLength(2);
      expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    it('should return null when conversation not found', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);

      const { loadConversationById } = await import('../../../services/conversationService.js');
      const result = await loadConversationById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('saveMessage', () => {
    it('should save a user message', async () => {
      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'user',
        content: 'Test message',
        agentType: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any);

      const { saveMessage } = await import('../../../services/conversationService.js');
      const result = await saveMessage('conv-123', 'user', 'Test message');

      expect(result.id).toBe('msg-123');
      expect(result.role).toBe('user');
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          role: 'user',
          content: 'Test message',
          agentType: undefined,
        },
      });
    });

    it('should save an assistant message with agentType', async () => {
      const mockMessage = {
        id: 'msg-456',
        conversationId: 'conv-123',
        role: 'assistant',
        content: 'Response',
        agentType: 'order',
        createdAt: new Date(),
      };

      vi.mocked(prisma.message.create).mockResolvedValue(mockMessage as any);

      const { saveMessage } = await import('../../../services/conversationService.js');
      const result = await saveMessage('conv-123', 'assistant', 'Response', 'order');

      expect(result.agentType).toBe('order');
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Response',
          agentType: 'order',
        },
      });
    });
  });

  describe('listUserConversations', () => {
    it('should list all user conversations ordered by updatedAt desc', async () => {
      const mockConversations = [
        {
          id: 'conv-2',
          userId: 'user_1',
          title: 'Recent',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-22'),
        },
        {
          id: 'conv-1',
          userId: 'user_1',
          title: 'Older',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.conversation.findMany).mockResolvedValue(mockConversations as any);

      const { listUserConversations } = await import('../../../services/conversationService.js');
      const result = await listUserConversations('user_1');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Recent');
      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_1' },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should return empty array when user has no conversations', async () => {
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const { listUserConversations } = await import('../../../services/conversationService.js');
      const result = await listUserConversations('user_1');

      expect(result).toEqual([]);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      vi.mocked(prisma.conversation.delete).mockResolvedValue({} as any);

      const { deleteConversation } = await import('../../../services/conversationService.js');
      await deleteConversation('conv-123');

      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 'conv-123' },
      });
    });
  });
});
