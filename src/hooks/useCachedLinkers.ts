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
  sortBy: 'recent' | 'popular'
): UseCachedLinkersResult {
  const [linkers, setLinkers] = useState<Linker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      await fetchLinkers(forceRefresh);
    },
    [fetchLinkers]
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
    fetchLinkers();
  }, [fetchLinkers]);

  return {
    linkers,
    loading,
    error,
    refresh,
    invalidateCache,
  };
}
