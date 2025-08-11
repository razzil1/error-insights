import { EventsService } from "../src/events/events.service";
import { Model } from "mongoose";
import { Client } from "@elastic/elasticsearch";
import { ErrorEvent } from "../src/events/schemas/error-event.schema";
import { CacheService } from "../src/common/cache/cache.service";
import { ErrorEventInput } from "../src/events/types/error-event.type";

describe("EventsService.search", () => {
  let model: Pick<Model<ErrorEvent>, never>;
  let es: Pick<Client, "search">;
  let cache: Pick<CacheService, "getOrSet">;
  let svc: EventsService;

  const baseQuery = {
    from: "2025-07-15T00:00:00Z",
    to: "2025-07-16T00:00:00Z",
    userId: "user-123",
    browser: "Chrome",
    url: "/dashboard",
    keyword: "TypeError",
    size: 10,
    fromOffset: 0,
  };

  const hitDoc: ErrorEventInput = {
    timestamp: "2025-07-15T10:10:00Z",
    userId: "user-123",
    browser: "Chrome",
    url: "/dashboard",
    errorMessage: "TypeError",
    stackTrace: "main.ts:22",
  };

  beforeEach(() => {
    model = {} as any;

    // default mock returns total as object
    es = {
      search: jest.fn().mockResolvedValue({
        hits: {
          total: { value: 123, relation: "eq" },
          hits: [{ _id: "doc1", _source: hitDoc }],
        },
      }),
    } as any;

    // pass-through caching to exercise service code paths
    cache = {
      getOrSet: jest.fn((_key, _ttl, fn) => fn()),
    } as any;

    svc = new EventsService(model as any, es as any, cache as any);
  });

  it("builds expected ES params, uses track_total_hits, and returns {items,total}", async () => {
    const res = await svc.search(baseQuery as any, "error-events");

    // ES.search was called with pagination and sort
    expect(es.search).toHaveBeenCalledTimes(1);
    const args = (es.search as jest.Mock).mock.calls[0][0];

    expect(args.index).toBe("error-events");
    expect(args.size).toBe(10);
    expect(args.from).toBe(0);
    expect(args.sort).toEqual([{ timestamp: { order: "desc" } }]);
    expect(args.track_total_hits).toBe(true);

    // verify bool query contains filters + keyword multi_match
    const query: any = args.query;
    expect(query.bool.filter).toEqual(
      expect.arrayContaining([
        { range: { timestamp: { gte: baseQuery.from, lte: baseQuery.to } } },
        { term: { userId: baseQuery.userId } },
        { term: { browser: baseQuery.browser } },
        { term: { url: baseQuery.url } },
      ])
    );
    expect(query.bool.must[0].multi_match.query).toBe(baseQuery.keyword);

    // returned shape
    expect(res.total).toBe(123);
    expect(res.items).toEqual([
      expect.objectContaining({
        id: "doc1",
        userId: "user-123",
        browser: "Chrome",
      }),
    ]);

    // cache wrapper used
    expect(cache.getOrSet).toHaveBeenCalledTimes(1);
  });

  it("handles numeric total form from ES", async () => {
    (es.search as jest.Mock).mockResolvedValueOnce({
      hits: {
        total: 7, // numeric form
        hits: [{ _id: "docX", _source: hitDoc }],
      },
    });

    const res = await svc.search(
      { ...baseQuery, size: 5, fromOffset: 5 } as any,
      "error-events"
    );

    expect(res.total).toBe(7);
    expect(res.items[0].id).toBe("docX");

    const args = (es.search as jest.Mock).mock.calls[0][0];
    expect(args.size).toBe(5);
    expect(args.from).toBe(5);
  });
});
