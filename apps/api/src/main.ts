import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { contextMiddleware } from './common/context/context.middleware';
import { APP_CONFIG, type AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get<AppConfig>(APP_CONFIG);

  app.use(contextMiddleware);
  app.use(helmet());
  // When CORS_ORIGINS is unset, reflect the request origin (allow all) — auth is
  // bearer-token based (no cookies). Set CORS_ORIGINS in production to lock down.
  app.enableCors({ origin: cfg.corsOrigins.length > 0 ? cfg.corsOrigins : true, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(cfg.port);
  new Logger('Bootstrap').log(`CALIPER API listening on http://localhost:${cfg.port}`);
}

void bootstrap();
