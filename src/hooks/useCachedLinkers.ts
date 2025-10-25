/**
 * useCachedLinkers - React hook for fetching linkers with automatic caching
 * Follows Dependency Inversion Principle - depends on abstractions
 */

import { useState, useEffect, useCallback } from 'react';
import { linkerRepository } from '../services/linkerRepository';
import { Linker } from '../services/linkerService';

interface UseCachedLinkersResult {
  linkers: Linker[];
  loading: boolean;
  error: string | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

export function useCachedLinkers(
  sortBy: 'recent' | 'popular',
  options?: { bypassCache?: boolean }
): UseCachedLinkersResult {
  const [linkers, setLinkers] = useState<Linker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bypassCache = options?.bypassCache === true;

  /**
   * Fetch linkers with caching
   */
  const fetchLinkers = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const data = await linkerRepository.getLinkers(sortBy, {
          forceRefresh,
        });

        setLinkers(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load linkers';
        setError(errorMessage);
        console.error('Error fetching linkers:', err);
      } finally {
        setLoading(false);
      }
    },
    [sortBy]
  );

  /**
   * Refresh linkers
   */
  const refresh = useCallback(
    async (forceRefresh: boolean = false) => {
      // If bypassCache is enabled and caller didn't explicitly override,
      // force refresh to always fetch fresh data.
      const effectiveForce = forceRefresh || bypassCache;
      await fetchLinkers(effectiveForce);
    },
    [fetchLinkers, bypassCache]
  );

  /**
   * Invalidate cache for current sort type
   */
  const invalidateCache = useCallback(() => {
    linkerRepository.invalidateCache(sortBy);
  }, [sortBy]);

  /**
   * Initial load
   */
  useEffect(() => {
    // On initial load, respect bypassCache by forcing refresh if enabled
    fetchLinkers(bypassCache);
  }, [fetchLinkers, bypassCache]);

  return {
    linkers,
    loading,
    error,
    refresh,
    invalidateCache,
  };
}
