/**
 * CacheService - Handles all caching operations
 * Follows Single Responsibility Principle
 */

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private storage: Storage;

  constructor(storage: Storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    try {
      this.storage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to set cache:', error);
      // Handle quota exceeded gracefully
      this.clearOldest();
    }
  }

  /**
   * Retrieve data from cache if not expired
   */
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);

      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Clear oldest cache entry (for quota management)
   */
  private clearOldest(): void {
    const keys = Object.keys(this.storage);
    let oldestKey = keys[0];
    let oldestTime = Infinity;

    keys.forEach((key) => {
      try {
        const item = JSON.parse(this.storage.getItem(key) || '{}');
        if (item.timestamp && item.timestamp < oldestTime) {
          oldestTime = item.timestamp;
          oldestKey = key;
        }
      } catch {
        // Invalid cache entry, skip
      }
    });

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(key: string): number | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;

      const cacheItem = JSON.parse(item);
      return Date.now() - cacheItem.timestamp;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
