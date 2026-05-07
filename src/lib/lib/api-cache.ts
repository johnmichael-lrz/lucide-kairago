interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Module-level cache persists within a Node.js process instance.
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Returns stale data even if expired — used for fallback. */
export function cacheGetStale<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  return entry ? entry.data : null;
}
