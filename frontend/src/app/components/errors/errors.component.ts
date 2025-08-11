import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { ErrorEventItem } from "../../shared/models";

@Component({
  selector: "app-errors",
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./errors.component.html",
  styleUrls: ["./errors.component.css"],
})
export class ErrorsComponent {
  _items: ErrorEventItem[] = [];
  len = 0;

  constructor(private cd: ChangeDetectorRef) {}

  @Input() set items(val: ErrorEventItem[] | null | undefined) {
    this._items = Array.isArray(val) ? val : [];
    this.len = this._items.length;
    this.cd.markForCheck();
  }

  trackById = (index: number, e: ErrorEventItem): string | number =>
    e.id ?? index;
}
