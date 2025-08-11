import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsModule } from "./events/events.module";
import { AppCacheModule } from "./common/cache/cache.module";
import { config } from "./config";

@Module({
  imports: [
    MongooseModule.forRoot(config.MONGO_URI),
    AppCacheModule,
    EventsModule,
  ],
})
export class AppModule {}
