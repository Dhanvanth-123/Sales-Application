/**
 * @caliper/shared — single source of truth for DTO/validation schemas and types,
 * shared between the API (apps/api) and the SPA (apps/web). Keeping the contract
 * here prevents client/server drift (see plan §12).
 */
export * from './brand';
export * from './enums';
export * from './common';
export * from './auth';
export * from './users';
export * from './customer';
export * from './part';
export * from './labour';
export * from './operation';
export * from './sale';
export * from './quotation';
export * from './pricing';
export * from './quality';
export * from './reports';
export * from './files';
export * from './dossier';
