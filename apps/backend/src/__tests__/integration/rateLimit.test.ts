import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    // Reset modules to clear rate limit map between tests
    vi.resetModules();
  });

  it('should enforce rate limit after 15 requests', async () => {
    // Mock AI and Prisma
    vi.doMock('ai', () => ({
      streamText: vi.fn(() => ({
        toTextStreamResponse: vi.fn(() => new Response('OK')),
      })),
      generateObject: vi.fn(() =>
        Promise.resolve({
          object: { agentType: 'support', confidence: 0.9, reasoning: 'Test' },
        })
      ),
      generateText: vi.fn(() => Promise.resolve({ text: 'Summary' })),
      tool: vi.fn((config) => config),
      stepCountIs: vi.fn((n) => n),
    }));

    vi.doMock('@prisma/client', () => {
      const mockClient = {
        conversation: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'conv-id',
              userId: 'user_1',
              title: 'New',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          ),
          findUnique: vi.fn(() =>
            Promise.resolve({
              id: 'conv-id',
              messages: [],
            })
          ),
        },
        message: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'msg-id',
              conversationId: 'conv-id',
              role: 'user',
              content: 'Test',
            })
          ),
        },
      };
      return { PrismaClient: vi.fn(() => mockClient) };
    });

    const request = (await import('supertest')).default;
    const appModule = await import('../../index.js');
    const app = appModule.default;

    // Make 15 requests (should all succeed)
    for (let i = 0; i < 15; i++) {
      const response = await request(app.fetch.bind(app))
        .post('/api/chat/messages')
        .set('x-user-id', 'user_1')
        .send({ message: `Message ${i}` });

      expect(response.status).toBe(200);
    }

    // 16th request should fail with 429
    const blockedResponse = await request(app.fetch.bind(app))
      .post('/api/chat/messages')
      .set('x-user-id', 'user_1')
      .send({ message: 'Message 16' });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body.error).toContain('Rate limit exceeded');
    expect(blockedResponse.headers['retry-after']).toBeDefined();
  });

  it('should track different users separately', async () => {
    vi.doMock('ai', () => ({
      streamText: vi.fn(() => ({
        toTextStreamResponse: vi.fn(() => new Response('OK')),
      })),
      generateObject: vi.fn(() =>
        Promise.resolve({
          object: { agentType: 'support', confidence: 0.9, reasoning: 'Test' },
        })
      ),
      generateText: vi.fn(() => Promise.resolve({ text: 'Summary' })),
      tool: vi.fn((config) => config),
      stepCountIs: vi.fn((n) => n),
    }));

    vi.doMock('@prisma/client', () => {
      const mockClient = {
        conversation: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'conv-id',
              userId: 'user_1',
              title: 'New',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          ),
          findUnique: vi.fn(() =>
            Promise.resolve({
              id: 'conv-id',
              messages: [],
            })
          ),
        },
        message: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'msg-id',
              conversationId: 'conv-id',
              role: 'user',
              content: 'Test',
            })
          ),
        },
      };
      return { PrismaClient: vi.fn(() => mockClient) };
    });

    const request = (await import('supertest')).default;
    const appModule = await import('../../index.js');
    const app = appModule.default;

    // User 1 makes 15 requests
    for (let i = 0; i < 15; i++) {
      await request(app.fetch.bind(app))
        .post('/api/chat/messages')
        .set('x-user-id', 'user_1')
        .send({ message: 'Test' });
    }

    // User 2 should still be able to make requests
    const user2Response = await request(app.fetch.bind(app))
      .post('/api/chat/messages')
      .set('x-user-id', 'user_2')
      .send({ message: 'Test' });

    expect(user2Response.status).toBe(200);
  });
});
