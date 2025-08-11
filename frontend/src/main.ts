import { importProvidersFrom } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { provideHttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { provideEchartsCore } from "ngx-echarts";
import * as echarts from "echarts";

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    importProvidersFrom(FormsModule, BrowserAnimationsModule),
    provideEchartsCore({ echarts }),
  ],
}).catch((err) => console.error(err));
