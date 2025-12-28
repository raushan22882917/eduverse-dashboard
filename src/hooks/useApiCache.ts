import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string, options: CacheOptions = {}): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = options.ttl || this.DEFAULT_TTL;
    const isStale = Date.now() - entry.timestamp > ttl;
    
    if (isStale && !options.staleWhileRevalidate) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  setPromise<T>(key: string, promise: Promise<T>): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.promise = promise;
    } else {
      this.cache.set(key, {
        data: null,
        timestamp: Date.now(),
        promise
      });
    }
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

export function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>();

  const { enabled = true, ...cacheOptions } = options;

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      // Check cache first
      const cached = apiCache.get<T>(key, cacheOptions);
      
      if (cached?.data && !cached.promise) {
        setData(cached.data);
        return;
      }

      // If we have stale data, show it while revalidating
      if (cached?.data && cacheOptions.staleWhileRevalidate) {
        setData(cached.data);
      }

      // Check if there's already a pending request
      if (cached?.promise) {
        try {
          const result = await cached.promise;
          setData(result);
          return;
        } catch (err) {
          // Continue to make new request if cached promise failed
        }
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const promise = fetcher();
        apiCache.setPromise(key, promise);
        
        const result = await promise;
        apiCache.set(key, result);
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key, enabled]);

  const mutate = (newData: T) => {
    apiCache.set(key, newData);
    setData(newData);
  };

  const invalidate = () => {
    apiCache.delete(key);
  };

  return { data, loading, error, mutate, invalidate };
}

export { apiCache };