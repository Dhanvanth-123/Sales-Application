// Generates an RS256 keypair for self-managed JWT auth (plan §8 Option A, §9.1).
// Cross-platform (no openssl needed). Writes PEM files into apps/api/secrets/,
// which is gitignored. Skips if keys already exist (pass --force to overwrite).
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const secretsDir = join(here, '..', 'secrets');
const privatePath = join(secretsDir, 'jwt.private.pem');
const publicPath = join(secretsDir, 'jwt.public.pem');
const force = process.argv.includes('--force');

if (!force && existsSync(privatePath) && existsSync(publicPath)) {
  console.log('JWT keys already exist — skipping (pass --force to overwrite).');
  process.exit(0);
}

mkdirSync(secretsDir, { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
writeFileSync(privatePath, privateKey, { mode: 0o600 });
writeFileSync(publicPath, publicKey);
console.log(`Wrote ${privatePath}`);
console.log(`Wrote ${publicPath}`);
