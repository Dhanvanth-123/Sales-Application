import * as fs from 'node:fs';
import { z } from 'zod';

/** DI token for the resolved, typed application config. */
export const APP_CONFIG = Symbol('APP_CONFIG');

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_ISSUER: z.string().default('caliper'),
  JWT_AUDIENCE: z.string().default('caliper-web'),

  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be >= 16 chars'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
});

function resolveKey(label: string, inline?: string, path?: string): string {
  if (inline && inline.trim().length > 0) {
    return inline.includes('\\n') ? inline.replace(/\\n/g, '\n') : inline;
  }
  if (path && fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8');
  }
  throw new Error(
    `${label} not configured. Set ${label} (inline PEM) or ${label}_PATH (file). ` +
      `For local dev, run: pnpm --filter @caliper/api keys:gen`,
  );
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  jwt: {
    privateKey: string;
    publicKey: string;
    accessTtl: string;
    issuer: string;
    audience: string;
  };
  refresh: { secret: string; ttl: string };
}

export function loadConfig(): AppConfig {
  const env = envSchema.parse(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: env.DATABASE_URL,
    jwt: {
      privateKey: resolveKey('JWT_PRIVATE_KEY', env.JWT_PRIVATE_KEY, env.JWT_PRIVATE_KEY_PATH),
      publicKey: resolveKey('JWT_PUBLIC_KEY', env.JWT_PUBLIC_KEY, env.JWT_PUBLIC_KEY_PATH),
      accessTtl: env.JWT_ACCESS_TTL,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    refresh: { secret: env.REFRESH_TOKEN_SECRET, ttl: env.REFRESH_TOKEN_TTL },
  };
}
