export interface ErrorEventItem {
  id: string;
  timestamp: string;
  userId: string;
  browser: string;
  url: string;
  errorMessage: string;
  stackTrace: string;
}

export interface FiltersQuery {
  from?: string;
  to?: string;
  userId?: string;
  browser?: string;
  url?: string;
  keyword?: string;
}

export interface SearchParams extends FiltersQuery {
  size?: number;
  fromOffset?: number;
}

export type RawSearchResponse =
  | { items: ErrorEventItem[]; total: number }
  | ErrorEventItem[];

export interface SearchResult {
  items: ErrorEventItem[];
  total: number;
}

export interface StatsParams {
  from?: string;
  to?: string;
  termField?: "browser" | "userId" | "url" | "errorMessage.keyword";
}

export type TermsBucket = { key: string | number; doc_count: number };
export interface StatsData {
  byTerm: TermsBucket[];
  topErrors: TermsBucket[];
}
