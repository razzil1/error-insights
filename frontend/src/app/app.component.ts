import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { NgIf } from "@angular/common";
import { ApiService } from "./services/api.service";
import { FiltersComponent } from "./components/filters/filters.component";
import { ErrorsComponent } from "./components/errors/errors.component";
import { StatsComponent } from "./components/stats/stats.component";
import {
  ErrorEventItem,
  FiltersQuery,
  SearchParams,
  SearchResult,
  StatsData,
  StatsParams,
} from "./shared/models";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [NgIf, FiltersComponent, ErrorsComponent, StatsComponent],
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  items: ErrorEventItem[] = [];
  total = 0;
  stats: StatsData | null = null;

  query: FiltersQuery = {};
  page = 1;
  pageSize = 10;

  loading = false;
  loadingStats = false;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    const to = new Date();
    const from = new Date(to);
    from.setFullYear(to.getFullYear() - 1);

    this.query = {
      from: from.toISOString(),
      to: to.toISOString(),
    };

    this.refreshList();
    this.refreshStats();
  }

  onApply(q: FiltersQuery): void {
    this.page = 1;
    this.query = q;
    this.refreshList();
    this.refreshStats();
  }

  private refreshList(): void {
    this.loading = true;
    const params: SearchParams = {
      ...this.query,
      size: this.pageSize,
      fromOffset: (this.page - 1) * this.pageSize,
    };

    this.api.search(params).subscribe(({ items, total }: SearchResult) => {
      this.items = [...items];
      this.total = total;
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  private refreshStats(): void {
    const { from, to } = this.query;
    const statsParams: StatsParams = { from, to, termField: "browser" };

    this.loadingStats = true;
    this.api.stats(statsParams).subscribe((s: StatsData) => {
      this.stats = s;
      this.loadingStats = false;
    });
  }

  nextPage(): void {
    if (this.page * this.pageSize >= this.total) return;
    this.page++;
    this.refreshList();
  }

  prevPage(): void {
    if (this.page === 1) return;
    this.page--;
    this.refreshList();
  }

  get totalPages(): number {
    const size = this.pageSize || 1;
    return Math.max(1, Math.ceil((this.total || 0) / size));
  }
}
