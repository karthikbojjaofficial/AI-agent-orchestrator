import { checkRateLimit, getResetTime } from '../services/rateLimiter.js';

export async function rateLimitMiddleware(c: any, next: any) {
  // Get identifier: userId or fallback to IP
  const userId = c.get('userId');
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const identifier = userId || ip;

  // Check rate limit
  const allowed = checkRateLimit(identifier);

  if (!allowed) {
    // Rate limit exceeded
    const retryAfter = getResetTime(identifier);
    return c.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      429,
      { 'Retry-After': retryAfter.toString() }
    );
  }

  // Continue to next middleware
  await next();
}
