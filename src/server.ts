import fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fastifyOpenapiGlue from 'fastify-openapi-glue';
import * as url from 'url';
import fastifyStatic from '@fastify/static';
import registerFastifySwagger from './plugins/registerFastifySwagger.js';
import replyWrapperPlugin from './plugins/ReplyWrapper.js';
import configSchema from './config.js';
import ioredisPlugin from './plugins/ioredis.js';
import errorHandler from './plugins/errorHandler.js';
import notFoundHandler from './plugins/notFoundHandler.js';
import getService from './services/index.js';

async function start() {
  const app = fastify({ logger: true });

  /**
 * Custom Error handler
 */
  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler(notFoundHandler);

  /**
 * Plugin: ReplyWrapper
 */
  const dirname = url.fileURLToPath(new URL('.', import.meta.url));

  await app.register(replyWrapperPlugin);
  await app.register(fastifyStatic, {
    root: `${dirname}html`,
  });

  /**
 * Plugin: Swagger UI
 * Halaman dapat diakses pada /documentation
 */
  await registerFastifySwagger(app);

  /**
 * Plugin: @fastify/env
 * cek file {@link ./config.ts}
 */
  await app.register(fastifyEnv, {
    schema: configSchema,
  });

  // eslint-disable-next-line no-console
  console.table(app.config);

  /**
 * Plugin: IORedis {@file ./plugins/ioredis.ts}
 * akses via req.redis
 * NOTES: Remember to always await (or then/catch) redis command
 * or else Fastify will crash
 */
  await app.register(ioredisPlugin, { confKey: 'redis', redisConfig: app.config });

  /**
 * Plugin: fastify-openapi-glue
 * Spek API disimpan pada file openapi.json
 */
  await app.register(fastifyOpenapiGlue, {
    specification: `${dirname}/openapi.json`,
    service: getService(app),
    prefix: '/api',
  });

  app.get('/', async (request, reply) => reply.sendFile('index.html'));
  app.get('/inbox/:number', async (request, reply) => reply.sendFile('index.html'));

  app.ready((errorOnAppReady) => {
    app.log.level = app.config.LOG_LEVEL;
    app.log.info('Ready');

    if (errorOnAppReady) {
      app.log.error(errorOnAppReady);
      process.exit(1);
    }

    app.listen({
      host: app.config.HOST,
      port: app.config.PORT,
    }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    });
  });
}

start();
