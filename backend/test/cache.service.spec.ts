import { CacheService } from "../src/common/cache/cache.service";

describe("CacheService.getOrSet", () => {
  it("returns cached value when present; otherwise sets it", async () => {
    const store = new Map<string, unknown>();
    const cacheManager = {
      get: jest.fn(async (k: string) => store.get(k)),
      set: jest.fn(async (k: string, v: unknown, _ttlMs: number) => {
        store.set(k, v);
      }),
    };

    const svc = new CacheService(cacheManager as any);

    const key = 'stats:{"from":"2025-01-01"}';
    const compute = jest.fn(async () => ({ ok: true }));

    const v1 = await svc.getOrSet(key, 60, compute);
    expect(v1).toEqual({ ok: true });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);

    const v2 = await svc.getOrSet(key, 60, compute);
    expect(v2).toEqual({ ok: true });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledTimes(1);
  });
});
