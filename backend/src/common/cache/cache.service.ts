import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;
    const val = await fn();
    await this.cache.set(key, val, ttlSeconds * 1000);
    return val;
  }
}
