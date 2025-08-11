import { Component, EventEmitter, Output, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { NgIf } from "@angular/common";
import { FiltersQuery } from "../../shared/models";

@Component({
  selector: "app-filters",
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: "./filters.component.html",
  styleUrls: ["./filters.component.css"],
})
export class FiltersComponent implements OnInit {
  @Output("apply") applyOut = new EventEmitter<FiltersQuery>();

  ready = signal(false);

  form = this.fb.group({
    from: [""],
    to: [""],
    userId: [""],
    browser: [""],
    keyword: [""],
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const to = new Date();
    const from = new Date(to);
    from.setFullYear(to.getFullYear() - 1);
    this.form.patchValue({
      from: this.toLocalInput(from),
      to: this.toLocalInput(to),
    });
    this.ready.set(true);
  }

  private toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onSubmit(): void {
    const v = this.form.value;
    const toIso = (s?: string | null) =>
      s ? new Date(s).toISOString() : undefined;
    this.applyOut.emit({
      from: toIso(v.from || undefined),
      to: toIso(v.to || undefined),
      userId: (v.userId || "").trim() || undefined,
      browser: (v.browser || "").trim() || undefined,
      keyword: (v.keyword || "").trim() || undefined,
    });
  }
}
