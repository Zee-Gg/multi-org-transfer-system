/**
 * Upstash Redis Rate Limiting
 * Provides persistent rate limiting across serverless instances
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error("UPSTASH_REDIS_REST_URL environment variable is not set");
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_TOKEN environment variable is not set");
}

/**
 * Redis client instance
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Rate limiters for different endpoints
 */

// Auth endpoints: 10 requests per minute per IP
export const authRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
});

// Transfer endpoints: 5 requests per minute per IP
export const transferRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "ratelimit:transfer",
});

// Search endpoints: 30 requests per minute per IP
export const searchRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "ratelimit:search",
});

// List endpoints: 60 requests per minute per IP
export const listRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "ratelimit:list",
});

// Per-user rate limiter (separate from IP-based)
// Useful for authenticated requests
export const userRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "ratelimit:user",
});

/**
 * Generic rate limit checker
 */
export interface RateLimitOptions {
  key: string;
  limit: number;
  window: "10 s" | "60 s" | "3600 s" | string;
  prefix?: string;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<{
  success: boolean;
  remaining: number;
  resetAfter: number;
}> {
  const limiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    prefix: options.prefix || "ratelimit",
  });

  const result = await limiter.limit(options.key);

  return {
    success: result.success,
    remaining: result.remaining,
    resetAfter: result.resetAfter,
  };
}

/**
 * Store rate limit violation for audit logging
 */
export async function recordRateLimitViolation(
  ipAddress: string,
  endpoint: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    // Store in Redis with 24-hour TTL
    await redis.incr(`violation:${ipAddress}:${endpoint}:${new Date().toISOString().split('T')[0]}`);
    await redis.expire(`violation:${ipAddress}:${endpoint}:${new Date().toISOString().split('T')[0]}`, 86400);

    // Optional: Log to audit trail (if you have database logging)
    // This would be done by the caller
  } catch (error) {
    console.error("Failed to record rate limit violation", error);
  }
}

/**
 * Get rate limit statistics for debugging
 */
export async function getRateLimitStats(prefix: string): Promise<Record<string, unknown>> {
  try {
    // Note: Upstash provides analytics through the dashboard
    // This is a placeholder for potential future metrics
    const stats = {
      prefix,
      message: "Use Upstash dashboard for analytics",
      timestamp: new Date().toISOString(),
    };

    return stats;
  } catch (error) {
    console.error("Failed to get rate limit stats", error);
    return {};
  }
}

/**
 * Clear rate limit for a key (admin function)
 */
export async function clearRateLimit(key: string, prefix: string = "ratelimit"): Promise<void> {
  try {
    // Upstash rate limiters use Redis keys
    // We can delete the key directly through Redis
    await redis.del(`${prefix}:${key}`);
  } catch (error) {
    console.error("Failed to clear rate limit", error);
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("Redis health check failed", error);
    return false;
  }
}
