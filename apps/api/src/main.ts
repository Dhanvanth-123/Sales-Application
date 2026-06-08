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
  app.enableCors({ origin: cfg.corsOrigins, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(cfg.port);
  new Logger('Bootstrap').log(`CALIPER API listening on http://localhost:${cfg.port}`);
}

void bootstrap();
