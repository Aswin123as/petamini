import { cacheService } from './cacheService';
import type { LinkPreview } from './linkerService';

const PREFIX = 'preview:';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

function keyFor(url: string): string {
  // Use encodeURIComponent to keep key storage-friendly
  return `${PREFIX}${encodeURIComponent(url)}`;
}

export const previewCache = {
  get(url: string): LinkPreview | null {
    return cacheService.get<LinkPreview>(keyFor(url));
  },
  set(url: string, data: LinkPreview, ttl: number = DEFAULT_TTL): void {
    cacheService.set(keyFor(url), data, ttl);
  },
  delete(url: string): void {
    cacheService.delete(keyFor(url));
  },
};
