import { EventsService } from "../src/events/events.service";
import { Model } from "mongoose";
import { Client } from "@elastic/elasticsearch";
import { ErrorEvent } from "../src/events/schemas/error-event.schema";
import { CacheService } from "../src/common/cache/cache.service";

describe("EventsService.stats", () => {
  let model: Pick<Model<ErrorEvent>, never>;
  let es: Pick<Client, "search">;
  let cache: Pick<CacheService, "getOrSet">;
  let svc: EventsService;

  beforeEach(() => {
    model = {} as any;

    es = {
      search: jest.fn().mockResolvedValue({
        took: 5,
        aggregations: {
          by_term: {
            buckets: [
              { key: "Chrome", doc_count: 3 },
              { key: "Firefox", doc_count: 1 },
            ],
          },
          top_errors: {
            buckets: [
              { key: "TypeError", doc_count: 2 },
              { key: "NetworkError", doc_count: 1 },
            ],
          },
        },
      }),
    } as any;

    cache = {
      getOrSet: jest.fn((_key, _ttl, fn) => fn()),
    } as any;

    svc = new EventsService(model as any, es as any, cache as any);
  });

  it("runs aggs and maps buckets into result", async () => {
    const out = await svc.stats(
      {
        from: "2025-07-15T00:00:00Z",
        to: "2025-07-16T00:00:00Z",
        termField: "browser",
      } as any,
      "error-events"
    );

    expect(es.search).toHaveBeenCalledTimes(1);
    const args = (es.search as jest.Mock).mock.calls[0][0];

    expect(args.index).toBe("error-events");
    expect(args.size).toBe(0);
    expect(args.aggs).toHaveProperty("by_term");
    expect(args.aggs).toHaveProperty("top_errors");

    expect(out.byTerm).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Chrome", doc_count: 3 }),
      ])
    );
    expect(out.topErrors[0]).toEqual(
      expect.objectContaining({ key: "TypeError" })
    );
    expect(cache.getOrSet).toHaveBeenCalledTimes(1);
  });
});
