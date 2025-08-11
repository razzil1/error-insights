import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { CacheService } from "./cache.service";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
          },
        }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class AppCacheModule {}
