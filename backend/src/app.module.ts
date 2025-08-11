import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventsModule } from "./events/events.module";
import { AppCacheModule } from "./common/cache/cache.module";

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    AppCacheModule,
    EventsModule,
  ],
})
export class AppModule {}
