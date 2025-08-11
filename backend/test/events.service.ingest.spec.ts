import { EventsService } from "../src/events/events.service";
import { Model } from "mongoose";
import { Client } from "@elastic/elasticsearch";
import { ErrorEvent } from "../src/events/schemas/error-event.schema";
import { CacheService } from "../src/common/cache/cache.service";
import { ErrorEventInput } from "../src/events/types/error-event.type";

describe("EventsService.ingestRawAndIndex", () => {
  const sample: ErrorEventInput[] = [
    {
      timestamp: "2025-07-15T10:10:00Z",
      userId: "user-123",
      browser: "Chrome",
      url: "/dashboard",
      errorMessage: "TypeError",
      stackTrace: "main.ts:22",
    },
    {
      timestamp: "2025-07-15T10:12:00Z",
      userId: "user-456",
      browser: "Firefox",
      url: "/login",
      errorMessage: "NetworkError",
      stackTrace: "fetch:101",
    },
  ];

  let model: Pick<Model<ErrorEvent>, "insertMany">;
  let es: Pick<Client, "bulk">;
  let cache: Pick<CacheService, "getOrSet">;
  let svc: EventsService;

  beforeEach(() => {
    model = {
      insertMany: jest.fn().mockResolvedValue(sample),
    };

    es = {
      bulk: jest.fn().mockResolvedValue({
        took: 10,
        errors: false,
        items: [{ index: {} }, { index: {} }],
      } as any),
    } as any;

    cache = { getOrSet: jest.fn() } as any;

    svc = new EventsService(model as any, es as any, cache as any);
  });

  it("inserts into Mongo and bulk-indexes into ES", async () => {
    await svc.ingestRawAndIndex(sample, "error-events");

    expect(model.insertMany).toHaveBeenCalledTimes(1);
    const inserted = (model.insertMany as jest.Mock).mock.calls[0][0];
    expect(inserted).toHaveLength(2);
    expect(inserted[0].timestamp instanceof Date).toBe(true);

    expect(es.bulk).toHaveBeenCalledTimes(1);
    const bulkArgs = (es.bulk as jest.Mock).mock.calls[0][0];

    expect(bulkArgs.operations.length).toBe(4);
    expect(bulkArgs.refresh).toBe(true);
  });

  it("no-ops on empty batch", async () => {
    await svc.ingestRawAndIndex([], "error-events");
    expect(model.insertMany).not.toHaveBeenCalled();
    expect(es.bulk).not.toHaveBeenCalled();
  });
});
