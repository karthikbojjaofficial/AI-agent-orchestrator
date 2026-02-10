import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono();

// CORS middleware
app.use('*', cors());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
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
