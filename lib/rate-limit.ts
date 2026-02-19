type WindowEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, WindowEntry>();

function getWindowMs() {
  return Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
}

function getMaxRequests() {
  return Number(process.env.RATE_LIMIT_MAX || 12);
}

export function rateLimit(key: string) {
  const now = Date.now();
  const windowMs = getWindowMs();
  const maxRequests = getMaxRequests();

  for (const [storeKey, entry] of memoryStore.entries()) {
    if (entry.resetAt <= now) {
      memoryStore.delete(storeKey);
    }
  }

  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000)
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    retryAfterSec: 0
  };
}
