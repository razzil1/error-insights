import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
import {
  SearchParams,
  RawSearchResponse,
  SearchResult,
  StatsData,
  StatsParams,
} from "../shared/models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly base = "/api/events";
  constructor(private http: HttpClient) {}

  search(params: SearchParams): Observable<SearchResult> {
    const httpParams = this.makeParams(params);
    return this.http
      .get<RawSearchResponse>(`${this.base}/search`, { params: httpParams })
      .pipe(
        map((res) =>
          Array.isArray(res) ? { items: res, total: res.length } : res
        )
      );
  }

  stats(params: StatsParams): Observable<StatsData> {
    return this.http.get<StatsData>(`${this.base}/stats`, {
      params: this.makeParams(params),
    });
  }

  private makeParams<T extends object>(o: T): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(o) as [string, unknown][]) {
      if (v === undefined || v === null || v === "") continue;
      p = p.set(k, String(v));
    }
    return p;
  }
}
