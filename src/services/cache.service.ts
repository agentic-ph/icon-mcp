import { CacheConfig, CacheError } from '../types/index.js';

/**
 * Cache entry with expiration timestamp
 */
interface CacheEntry {
  value: unknown;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Simple in-memory cache service with TTL support
 *
 * Provides caching capabilities for icon data, search results,
 * and other frequently accessed information to improve performance.
 */
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      maxSize: 1000, // Maximum 1000 entries
      checkPeriod: 60 * 1000, // Check for expired entries every minute
      ...config,
    };

    this.startCleanupTimer();
  }

  /**
   * Store a value in the cache with optional custom TTL
   */
  set<T>(key: string, value: T, customTtl?: number): void {
    try {
      const ttl = customTtl ?? this.config.ttl;
      const now = Date.now();

      // Check if we need to evict entries due to size limit
      if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
        this.evictLeastRecentlyUsed();
      }

      const entry: CacheEntry = {
        value,
        expiresAt: now + ttl,
        accessCount: 0,
        lastAccessed: now,
      };

      this.cache.set(key, entry);
    } catch (error) {
      throw new CacheError(`Failed to set cache entry for key "${key}": ${error}`);
    }
  }

  /**
   * Retrieve a value from the cache
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        return null;
      }

      const now = Date.now();

      // Check if entry has expired
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = now;

      return entry.value as T;
    } catch (error) {
      throw new CacheError(`Failed to get cache entry for key "${key}": ${error}`);
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let totalAccesses = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        totalAccesses += entry.accessCount;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccesses > 0 ? (this.cache.size - expiredEntries) / totalAccesses : 0,
      totalAccesses,
      expiredEntries,
    };
  }

  /**
   * Get or set a value using a factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, customTtl?: number): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    try {
      const value = await factory();
      this.set(key, value, customTtl);
      return value;
    } catch (error) {
      throw new CacheError(`Failed to execute factory function for key "${key}": ${error}`);
    }
  }

  /**
   * Start the cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.checkPeriod);

    // Ensure the timer doesn't keep the process alive
    this.cleanupTimer.unref();
  }

  /**
   * Stop the cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Remove expired entries from the cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
  }

  /**
   * Evict the least recently used entry to make space
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Generate a cache key from multiple parts
   */
  static generateKey(...parts: (string | number | boolean)[]): string {
    return parts
      .map((part) => String(part))
      .join(':')
      .toLowerCase()
      .replace(/[^a-z0-9:]/g, '_');
  }

  /**
   * Cleanup resources when the cache service is destroyed
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}
