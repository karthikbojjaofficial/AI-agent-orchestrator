import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { callSupportAgent, callOrderAgent, callBillingAgent, callRouterAgent } from './services/agentService.js';
import { extractUserId } from './middleware/userMiddleware.js';
import { validateUser } from './middleware/validateUser.js';
import chat from './controllers/chatController.js';

const app = new Hono();

// CORS middleware
app.use('*', cors());

// API routes with user middleware
app.use('/api/*', extractUserId, validateUser);
app.route('/api/chat', chat);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Test agent endpoint
app.post('/test-agent', async (c) => {
  const { message, userId } = await c.req.json();
  const response = await callSupportAgent(message, userId || 'user_1', [], 'test-conv-id');
  return response.toTextStreamResponse();
});

// Test order agent endpoint
app.post('/test-order-agent', async (c) => {
  const { message, userId } = await c.req.json();
  const response = await callOrderAgent(message, userId || 'user_1', [], 'test-conv-id');
  return response.toTextStreamResponse();
});

// Test billing agent endpoint
app.post('/test-billing-agent', async (c) => {
  const { message, userId } = await c.req.json();
  const response = await callBillingAgent(message, userId || 'user_1', [], 'test-conv-id');
  return response.toTextStreamResponse();
});

// Test router agent endpoint
app.post('/test-router-agent', async (c) => {
  const { message, userId } = await c.req.json();
  const result = await callRouterAgent(message, userId || 'user_1', []);
  return c.json(result);
});

// Basic error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: err.message || 'Internal Server Error'
    },
    500
  );
});

// Setup port and start server
const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port: port
});

console.log(`Server running on http://localhost:${port}`);

export default app;
