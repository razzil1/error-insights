import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from "@angular/core";
import { NgIf } from "@angular/common";
import { NgxEchartsDirective } from "ngx-echarts";
import * as echarts from "echarts";
import { StatsData, TermsBucket } from "../../shared/models";

@Component({
  selector: "app-stats",
  standalone: true,
  imports: [NgIf, NgxEchartsDirective],
  templateUrl: "./stats.component.html",
  styleUrls: ["./stats.component.css"],
})
export class StatsComponent implements OnChanges {
  @Input() data?: StatsData;

  pieByTermOptions = signal<echarts.EChartsOption | null>(null);
  pieErrorsOptions = signal<echarts.EChartsOption | null>(null);

  ngOnChanges(_: SimpleChanges) {
    const byTerm = this.data?.byTerm ?? [];
    const topErrors = this.data?.topErrors ?? [];

    const buildPie = (buckets: TermsBucket[]): echarts.EChartsOption => ({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { top: 0, type: "scroll" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "55%"],
          avoidLabelOverlap: true,
          label: { show: true },
          data: buckets.map((b) => ({
            name: String(b.key),
            value: b.doc_count,
          })),
        },
      ],
    });

    this.pieByTermOptions.set(buildPie(byTerm));
    this.pieErrorsOptions.set(buildPie(topErrors));
  }
}
