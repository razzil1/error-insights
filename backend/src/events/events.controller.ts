import { Controller, Get, Query, Post, Body } from "@nestjs/common";
import { EventsService } from "./events.service";
import { SearchEventsDto, StatsQueryDto } from "./dto";
import { ErrorEventInput } from "./types/error-event.type";

@Controller("events")
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post("ingest")
  async ingest(@Body() events: ErrorEventInput[]) {
    await this.eventsService.ingestRawAndIndex(events, process.env.ES_INDEX);
    return { ok: true, count: events.length };
  }

  @Get("search")
  search(@Query() q: SearchEventsDto) {
    return this.eventsService.search(q, process.env.ES_INDEX);
  }

  @Get("stats")
  stats(@Query() q: StatsQueryDto) {
    return this.eventsService.stats(q, process.env.ES_INDEX);
  }
}
