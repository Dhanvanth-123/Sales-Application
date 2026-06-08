import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped context (plan §6.3). Carries the acting user, client IP, and the
 * mandatory `reason` for audited writes from the auth guard / controller down to
 * the Prisma audit extension — without threading them through every call.
 */
export interface RequestContext {
  userId?: string;
  ip?: string;
  reason?: string;
}

const als = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(ctx: RequestContext, fn: () => T): T {
    return als.run(ctx, fn);
  },
  get(): RequestContext | undefined {
    return als.getStore();
  },
  setUser(userId: string): void {
    const store = als.getStore();
    if (store) store.userId = userId;
  },
  setReason(reason: string): void {
    const store = als.getStore();
    if (store) store.reason = reason;
  },
};
