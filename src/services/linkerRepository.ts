/**
 * LinkerRepository - Handles data fetching with caching
 * Follows Repository Pattern and Open/Closed Principle
 */

import { linkerService, Linker } from './linkerService';
import { cacheService } from './cacheService';

export interface FetchOptions {
  forceRefresh?: boolean;
  cacheTTL?: number;
}

export class LinkerRepository {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_PREFIX = 'linkers:';

  /**
   * Get cache key for specific sort type
   */
  private getCacheKey(sortBy: string): string {
    return `${this.CACHE_PREFIX}${sortBy}`;
  }

  /**
   * Fetch linkers with automatic caching
   */
  async getLinkers(
    sortBy: 'recent' | 'popular',
    options: FetchOptions = {}
  ): Promise<Linker[]> {
    const { forceRefresh = false, cacheTTL = this.DEFAULT_TTL } = options;
    const cacheKey = this.getCacheKey(sortBy);

    // Try to get from cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = cacheService.get<Linker[]>(cacheKey);
      if (cachedData) {
        console.log(`📦 Cache hit for ${sortBy}`);

        // Fetch fresh data in background if cache is older than 1 minute
        const cacheAge = cacheService.getAge(cacheKey);
        if (cacheAge && cacheAge > 60 * 1000) {
          this.refreshCacheInBackground(sortBy, cacheTTL);
        }

        return cachedData;
      }
    }

    // Fetch from API
    console.log(`🌐 Fetching fresh data for ${sortBy}`);
    const freshData = await linkerService.getAllLinkers(sortBy);

    // Store in cache
    cacheService.set(cacheKey, freshData, cacheTTL);

    return freshData;
  }

  /**
   * Refresh cache in background without blocking UI
   */
  private async refreshCacheInBackground(
    sortBy: 'recent' | 'popular',
    ttl: number
  ): Promise<void> {
    try {
      console.log(`🔄 Background refresh for ${sortBy}`);
      const freshData = await linkerService.getAllLinkers(sortBy);
      const cacheKey = this.getCacheKey(sortBy);
      cacheService.set(cacheKey, freshData, ttl);
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }

  /**
   * Invalidate cache for specific sort type
   */
  invalidateCache(sortBy?: string): void {
    if (sortBy) {
      const cacheKey = this.getCacheKey(sortBy);
      cacheService.delete(cacheKey);
      console.log(`🗑️ Cache invalidated for ${sortBy}`);
    } else {
      // Clear all linker caches
      ['recent', 'popular'].forEach((type) => {
        const cacheKey = this.getCacheKey(type);
        cacheService.delete(cacheKey);
      });
      console.log('🗑️ All linker caches invalidated');
    }
  }

  /**
   * Update cache after creating a new linker
   */
  updateCacheAfterCreate(newLinker: Linker): void {
    // Update 'recent' cache by prepending new linker
    const recentKey = this.getCacheKey('recent');
    const cachedRecent = cacheService.get<Linker[]>(recentKey);

    if (cachedRecent) {
      const updated = [newLinker, ...cachedRecent];
      cacheService.set(recentKey, updated, this.DEFAULT_TTL);
      console.log('📝 Cache updated with new linker');
    }
  }

  /**
   * Update cache after promoting a linker
   */
  updateCacheAfterPromote(linkerId: string, updatedLinker: Linker): void {
    ['recent', 'popular'].forEach((sortType) => {
      const cacheKey = this.getCacheKey(sortType);
      const cached = cacheService.get<Linker[]>(cacheKey);

      if (cached) {
        const updated = cached.map((linker) =>
          linker.id === linkerId ? updatedLinker : linker
        );
        cacheService.set(cacheKey, updated, this.DEFAULT_TTL);
      }
    });
    console.log('👍 Cache updated after promote');
  }

  /**
   * Update cache after deleting a linker
   */
  updateCacheAfterDelete(linkerId: string): void {
    ['recent', 'popular'].forEach((sortType) => {
      const cacheKey = this.getCacheKey(sortType);
      const cached = cacheService.get<Linker[]>(cacheKey);

      if (cached) {
        const updated = cached.filter((linker) => linker.id !== linkerId);
        cacheService.set(cacheKey, updated, this.DEFAULT_TTL);
      }
    });
    console.log('🗑️ Cache updated after delete');
  }
}

// Export singleton instance
export const linkerRepository = new LinkerRepository();
