import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mock the AI SDK before importing the app
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toTextStreamResponse: vi.fn(() => new Response('Mocked AI response')),
  })),
  generateObject: vi.fn(() =>
    Promise.resolve({
      object: { agentType: 'support', confidence: 0.9, reasoning: 'Test' },
    })
  ),
  generateText: vi.fn(() => Promise.resolve({ text: 'Mocked summary' })),
  tool: vi.fn((config) => config),
  stepCountIs: vi.fn((n) => n),
}));

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    conversation: {
      create: vi.fn(() =>
        Promise.resolve({
          id: 'test-conv-id',
          userId: 'user_1',
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
      findUnique: vi.fn(() =>
        Promise.resolve({
          id: 'test-conv-id',
          userId: 'user_1',
          messages: [],
        })
      ),
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'conv-1',
            userId: 'user_1',
            title: 'Test Conversation',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      ),
      delete: vi.fn(() => Promise.resolve({})),
    },
    message: {
      create: vi.fn(() =>
        Promise.resolve({
          id: 'msg-id',
          conversationId: 'test-conv-id',
          role: 'user',
          content: 'Test',
          createdAt: new Date(),
        })
      ),
    },
    order: {
      findMany: vi.fn(() => Promise.resolve([])),
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    payment: {
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('Chat API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Import app after mocks are set up
    const appModule = await import('../../index.js');
    app = appModule.default;
  });

  describe('POST /api/chat/messages', () => {
    it('should create new conversation and send message', async () => {
      const response = await request(app.fetch.bind(app))
        .post('/api/chat/messages')
        .set('x-user-id', 'user_1')
        .send({
          message: 'Hello, I need help',
        });

      expect(response.status).toBe(200);
    });

    it('should reject request without user ID', async () => {
      const response = await request(app.fetch.bind(app))
        .post('/api/chat/messages')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing x-user-id header');
    });

    it('should reject request with invalid user ID', async () => {
      const response = await request(app.fetch.bind(app))
        .post('/api/chat/messages')
        .set('x-user-id', 'invalid_user')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should list user conversations', async () => {
      const response = await request(app.fetch.bind(app))
        .get('/api/chat/conversations')
        .set('x-user-id', 'user_1');

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
      expect(Array.isArray(response.body.conversations)).toBe(true);
    });

    it('should reject without user ID', async () => {
      const response = await request(app.fetch.bind(app))
        .get('/api/chat/conversations');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/chat/conversations/:id', () => {
    it('should get conversation by ID', async () => {
      const response = await request(app.fetch.bind(app))
        .get('/api/chat/conversations/test-conv-id')
        .set('x-user-id', 'user_1');

      expect(response.status).toBe(200);
      expect(response.body.conversation).toBeDefined();
    });
  });

  describe('DELETE /api/chat/conversations/:id', () => {
    it('should delete conversation', async () => {
      const response = await request(app.fetch.bind(app))
        .delete('/api/chat/conversations/test-conv-id')
        .set('x-user-id', 'user_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health check', async () => {
      const response = await request(app.fetch.bind(app))
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
