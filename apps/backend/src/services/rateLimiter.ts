// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT = 15; // requests per window
const WINDOW_MS = 60000; // 1 minute

// Check if request is within rate limit
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // No record or window expired - reset and allow
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return true;
  }

  // Within window - check if under limit
  if (record.count < RATE_LIMIT) {
    record.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

// Get seconds until rate limit resets
export function getResetTime(identifier: string): number {
  const record = rateLimitMap.get(identifier);
  if (!record) return 0;

  const secondsRemaining = Math.ceil((record.resetTime - Date.now()) / 1000);
  return secondsRemaining > 0 ? secondsRemaining : 0;
}
