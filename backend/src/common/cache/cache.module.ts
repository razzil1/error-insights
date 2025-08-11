import { Module, Global } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";
import { config } from "src/config";
import { CacheService } from "./cache.service";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: config.REDIS_HOST,
            port: Number(config.REDIS_PORT),
          },
        }),
      }),
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class AppCacheModule {}
