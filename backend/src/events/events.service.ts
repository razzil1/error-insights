import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Client, estypes } from "@elastic/elasticsearch";
import { config } from "src/config";
import { ErrorEvent } from "./schemas/error-event.schema";
import { SearchEventsDto, StatsQueryDto } from "./dto";
import { CacheService } from "../common/cache/cache.service";
import { ErrorEventInput } from "./types/error-event.type";

type IndexedErrorEvent = ErrorEventInput & { id: string };
type TermsBucket = { key: string | number; doc_count: number };
type StatsResult = { byTerm: TermsBucket[]; topErrors: TermsBucket[] };
type SearchResult = { items: IndexedErrorEvent[]; total: number };

type BulkOp<T> =
  | { index: { _index: string; _id?: string } }
  | { create: { _index: string; _id?: string } }
  | { update: { _index: string; _id: string } }
  | { delete: { _index: string; _id: string } }
  | T;

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(ErrorEvent.name) private model: Model<ErrorEvent>,
    private es: Client,
    private cache: CacheService
  ) {}

  async ingestRawAndIndex(
    events: ErrorEventInput[],
    index: string
  ): Promise<void> {
    if (!events?.length) {
      this.logger.warn(`ingest.skip: empty batch`);
      return;
    }

    this.logger.log(`ingest: start count=${events.length} index=${index}`);

    try {
      const docs = events.map((e) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
      const inserted = await this.model.insertMany(docs);
      this.logger.log(`ingest.mongo: inserted=${inserted.length}`);
    } catch (err) {
      this.logger.error(
        "ingest.mongo: failed to insert documents",
        (err as Error).stack
      );
      throw err;
    }

    try {
      const ops: Array<BulkOp<ErrorEventInput>> = events.flatMap((doc) => [
        { index: { _index: index } },
        doc,
      ]);

      const bulkResp = await this.es.bulk<ErrorEventInput>({
        refresh: true,
        operations: ops,
      });
      const br = bulkResp as unknown as estypes.BulkResponse;
      if (br?.errors) {
        this.logger.warn("ingest.es.bulk: completed with item errors");
      } else {
        this.logger.log(
          `ingest.es.bulk: indexed=${
            Array.isArray(br?.items) ? br.items.length : events.length
          }`
        );
      }
      this.logger.log("ingest: done");
    } catch (err) {
      this.logger.error(
        "ingest.es.bulk: failed to index documents",
        (err as Error).stack
      );
      throw err;
    }
  }

  private buildSearchQuery(q: SearchEventsDto): estypes.QueryDslQueryContainer {
    const must: estypes.QueryDslQueryContainer[] = [];
    const filter: estypes.QueryDslQueryContainer[] = [];

    if (q.from || q.to)
      filter.push({ range: { timestamp: { gte: q.from, lte: q.to } } });
    if (q.userId) filter.push({ term: { userId: q.userId } });
    if (q.browser) filter.push({ term: { browser: q.browser } });
    if (q.url) filter.push({ term: { url: q.url } });

    if (q.keyword) {
      must.push({
        multi_match: {
          query: q.keyword,
          fields: ["errorMessage^2", "stackTrace"],
          type: "best_fields",
        },
      });
    }
    return { bool: { must, filter } };
  }

  async search(q: SearchEventsDto, index: string): Promise<SearchResult> {
    const key = `search:${JSON.stringify(q)}`;
    const ttl = Number(config.CACHE_TTL_SECONDS);

    this.logger.log(`search: index=${index} cacheKey=${key} ttl=${ttl}s`);

    return this.cache.getOrSet<SearchResult>(key, ttl, async () => {
      this.logger.log("search.cache: miss -> querying Elasticsearch");
      try {
        const resp = await this.es.search<ErrorEventInput>({
          index,
          size: q.size ?? 10,
          from: q.fromOffset ?? 0,
          sort: [{ timestamp: { order: "desc" } }],
          query: this.buildSearchQuery(q),
          track_total_hits: true,
        });

        const hits = resp.hits?.hits ?? [];
        const items = hits
          .filter((h): h is estypes.SearchHit<ErrorEventInput> => !!h._source)
          .map((h) => ({ id: String(h._id), ...h._source! }));

        const totalRaw = resp.hits?.total;
        const total =
          typeof totalRaw === "number" ? totalRaw : totalRaw?.value ?? 0;

        this.logger.log(`search.es: hits=${items.length}, total=${total}`);
        return { items, total };
      } catch (err) {
        this.logger.error("search.es: query failed", (err as Error).stack);
        throw err;
      }
    });
  }

  async stats(q: StatsQueryDto, index: string): Promise<StatsResult> {
    const key = `stats:${JSON.stringify(q)}`;
    const ttl = Number(config.CACHE_TTL_SECONDS);

    this.logger.log(
      `stats: index=${index} termField=${
        q.termField ?? "browser"
      } cacheKey=${key} ttl=${ttl}s`
    );

    return this.cache.getOrSet<StatsResult>(key, ttl, async () => {
      this.logger.log("stats.cache: miss -> querying Elasticsearch");

      try {
        const filter: estypes.QueryDslQueryContainer[] = [];
        if (q.from || q.to)
          filter.push({ range: { timestamp: { gte: q.from, lte: q.to } } });

        const termField = q.termField || "browser";
        const resp = await this.es.search({
          index,
          size: 0,
          query: filter.length ? { bool: { filter } } : { match_all: {} },
          aggs: {
            by_term: { terms: { field: termField, size: 10 } },
            top_errors: { terms: { field: "errorMessage.keyword", size: 5 } },
          },
        });

        const aggs = resp.aggregations as
          | Record<string, estypes.AggregationsAggregate>
          | undefined;

        const byTerm =
          ((aggs?.by_term as estypes.AggregationsStringTermsAggregate)
            ?.buckets as TermsBucket[]) ??
          ((aggs?.by_term as estypes.AggregationsLongTermsAggregate)
            ?.buckets as TermsBucket[]) ??
          [];

        const topErrors =
          ((aggs?.top_errors as estypes.AggregationsStringTermsAggregate)
            ?.buckets as TermsBucket[]) ?? [];

        this.logger.log(
          `stats.es: byTerm=${byTerm.length} topErrors=${topErrors.length}`
        );
        return { byTerm, topErrors };
      } catch (err) {
        this.logger.error("stats.es: query failed", (err as Error).stack);
        throw err;
      }
    });
  }
}
