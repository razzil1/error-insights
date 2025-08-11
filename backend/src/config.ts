export const config = {
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://mongo:27017/error_insights",
  ES_NODE: process.env.ES_NODE ?? "http://elasticsearch:9200",
  REDIS_HOST: process.env.REDIS_HOST ?? "redis",
  REDIS_PORT: Number(process.env.REDIS_PORT ?? "6379"),
  ES_INDEX: process.env.ES_INDEX ?? "error-events",
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS ?? "60"),
  PORT: Number(process.env.PORT ?? "3000"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
