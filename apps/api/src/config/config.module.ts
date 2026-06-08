import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_CONFIG, loadConfig } from './configuration';

/**
 * Loads .env into process.env (via @nestjs/config) and exposes the validated,
 * typed AppConfig under the APP_CONFIG token. Global so any provider can inject it.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] })],
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class CoreConfigModule {}
