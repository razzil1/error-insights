import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { ErrorEvent, ErrorEventSchema } from "./schemas/error-event.schema";
import { Client } from "@elastic/elasticsearch";
import { CreateIndexOptions, ensureErrorIndex } from "./es/error-event.index";
import mapping from "./es/error-event.mapping.json";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ErrorEvent.name, schema: ErrorEventSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    {
      provide: Client,
      useFactory: async () => {
        const client = new Client({
          node: process.env.ES_NODE,
        });

        await ensureErrorIndex(
          client,
          process.env.ES_INDEX,
          mapping as CreateIndexOptions
        );

        return client;
      },
    },
  ],
})
export class EventsModule {}
