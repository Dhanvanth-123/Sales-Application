import type { NextFunction, Request, Response } from 'express';
import { requestContext } from './request-context';

/**
 * Global middleware: wraps every request in an AsyncLocalStorage scope seeded with
 * the client IP, so the auth guard and audited controllers can attach the user and
 * `reason` for the audit extension (plan §6.3).
 *
 * Registered via `app.use()` in main.ts (rather than a NestModule `forRoutes('*')`,
 * which trips Express 5's path parser).
 */
export function contextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket?.remoteAddress ?? undefined;
  requestContext.run({ ip }, () => next());
}
