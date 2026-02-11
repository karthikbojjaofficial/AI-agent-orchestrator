export async function extractUserId(c: any, next: any) {
  const userId = c.req.header('x-user-id');

  // Attach userId to context
  c.set('userId', userId);

  await next();
}
