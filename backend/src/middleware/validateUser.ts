import { Context, Next } from 'hono';

const VALID_USERS = ['user_1', 'user_2', 'user_3'];

export async function validateUser(c: Context, next: Next) {
  const userId = c.get('userId');

  // Check if userId exists
  if (!userId) {
    return c.json({ error: 'Missing x-user-id header' }, 400);
  }

  // Check if userId is valid
  if (!VALID_USERS.includes(userId)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }

  await next();
}
