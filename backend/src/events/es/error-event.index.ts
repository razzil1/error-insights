import { Client, estypes } from "@elastic/elasticsearch";

export type CreateIndexOptions = Pick<
  estypes.IndicesCreateRequest,
  "mappings" | "settings" | "aliases"
>;

type ExistsReturn = boolean | { body: boolean };
const hasBody = (v: ExistsReturn): v is { body: boolean } =>
  typeof v === "object" && v !== null && "body" in v;

export async function ensureErrorIndex(
  client: Client,
  indexName: string,
  options: CreateIndexOptions
): Promise<void> {
  const existsResp = (await client.indices.exists({
    index: indexName,
  })) as ExistsReturn;
  const exists = hasBody(existsResp) ? existsResp.body : existsResp;
  if (!exists) {
    await client.indices.create({ index: indexName, ...options });
  }
}
