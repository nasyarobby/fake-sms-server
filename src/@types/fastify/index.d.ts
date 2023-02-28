import Redis from 'ioredis';

type Config = {
  LOG_LEVEL: string;
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  REDIS_SENTINEL?: string;
  REDIS_SENTINEL_MASTER?: string;
  REDIS_PASS?: string;
  REDIS_DB?: number;
  REDIS_PORT?: number;
  REDIS_HOST?: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    redis: Redis
  }

  export interface FastifyRequest {
  }

  export interface FastifyReply {
    bypassWrapper: (val: boolean) => FastifyReply;
    wrapperIsBypassed: boolean;
    setApi: (apiObj:{
      status?: string,
      code: string, message: string,
    }) => FastifyReply;
    api: {
      message: string;
      code: string;
      status: string;
    };

  }
}
