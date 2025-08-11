import { ensureErrorIndex } from "../src/events/es/error-event.index";
import { Client } from "@elastic/elasticsearch";
import { estypes } from "@elastic/elasticsearch";

describe("ensureErrorIndex", () => {
  const mapping = {
    mappings: {
      properties: {
        timestamp: { type: "date" },
        userId: { type: "keyword" },
      },
    },
  } satisfies Pick<estypes.IndicesCreateRequest, "mappings">;

  it("does nothing when index exists", async () => {
    const client = {
      indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn(),
      },
    } as unknown as Client;

    await ensureErrorIndex(client, "error-events", mapping);
    expect(client.indices.exists).toHaveBeenCalledWith({
      index: "error-events",
    });
    expect(client.indices.create).not.toHaveBeenCalled();
  });

  it("creates index when missing", async () => {
    const client = {
      indices: {
        exists: jest.fn().mockResolvedValue(false),
        create: jest.fn().mockResolvedValue({}),
      },
    } as unknown as Client;

    await ensureErrorIndex(client, "error-events", mapping);
    expect(client.indices.create).toHaveBeenCalledWith({
      index: "error-events",
      ...mapping,
    });
  });
});
