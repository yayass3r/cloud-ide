/**
 * Simple in-memory rate limiter using a Map.
 * For production, use Redis or Upstash.
 *
 * Each IP gets a rolling window of `windowMs` milliseconds.
 * If the IP exceeds `limit` requests within that window, subsequent requests
 * are rejected until the window resets.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key)
      }
    }
    lastCleanup = now
  }
}

/**
 * Check if a request from the given IP should be allowed.
 *
 * @param ip - Client IP address
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { success, remaining } — true if allowed, false if rate-limited
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

/**
 * Get client IP from a Next.js request object
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}
