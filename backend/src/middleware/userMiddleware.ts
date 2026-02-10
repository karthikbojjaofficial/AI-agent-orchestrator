import { Context, Next } from 'hono';

export async function extractUserId(c: Context, next: Next) {
  const userId = c.req.header('x-user-id');

  // Attach userId to context
  c.set('userId', userId);

  await next();
}
