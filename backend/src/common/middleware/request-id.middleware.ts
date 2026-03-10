import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Middleware that attaches a unique request ID to every incoming request.
 * If the client already sends an `X-Request-Id` header, it is reused;
 * otherwise a new UUID v4 is generated.
 *
 * The ID is:
 * - stored on `req.id` so pino-http picks it up automatically
 * - echoed back in the `X-Request-Id` response header for correlation
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const id =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();

    // pino-http reads `req.id` by default when genReqId is not configured,
    // but we also set it explicitly for clarity.
    (req as unknown as Record<string, unknown>)['id'] = id;

    res.setHeader('X-Request-Id', id);
    next();
  }
}
