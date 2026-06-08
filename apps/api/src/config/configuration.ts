import * as fs from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import { z } from 'zod';

/** DI token for the resolved, typed application config. */
export const APP_CONFIG = Symbol('APP_CONFIG');

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default(''),
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

/** Resolve a PEM key from an inline value or a file path; null if neither is set. */
function tryResolveKey(inline?: string, path?: string): string | null {
  if (inline && inline.trim().length > 0) {
    return inline.includes('\\n') ? inline.replace(/\\n/g, '\n') : inline;
  }
  if (path && fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8');
  }
  return null;
}

/**
 * Resolve the RS256 keypair. Uses env/file keys when provided; otherwise generates
 * an ephemeral in-memory keypair so the API runs zero-config on a fresh host
 * (e.g. Render). Ephemeral keys are per-instance and reset on restart — set
 * JWT_PRIVATE_KEY / JWT_PUBLIC_KEY for stable, multi-instance auth.
 */
function resolveKeyPair(env: z.infer<typeof envSchema>): { privateKey: string; publicKey: string } {
  const privateKey = tryResolveKey(env.JWT_PRIVATE_KEY, env.JWT_PRIVATE_KEY_PATH);
  const publicKey = tryResolveKey(env.JWT_PUBLIC_KEY, env.JWT_PUBLIC_KEY_PATH);
  if (privateKey && publicKey) return { privateKey, publicKey };

  const generated = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  // eslint-disable-next-line no-console
  console.warn(
    '[config] No JWT keys configured — generated an ephemeral RS256 keypair. ' +
      'Set JWT_PRIVATE_KEY / JWT_PUBLIC_KEY for stable auth across restarts/instances.',
  );
  return generated;
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
  const { privateKey, publicKey } = resolveKeyPair(env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: env.DATABASE_URL,
    jwt: {
      privateKey,
      publicKey,
      accessTtl: env.JWT_ACCESS_TTL,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    refresh: { secret: env.REFRESH_TOKEN_SECRET, ttl: env.REFRESH_TOKEN_TTL },
  };
}
