import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const requestId = (request as unknown as Record<string, unknown>)['id'] as
      | string
      | undefined;

    // Structured error logging with request context
    this.logger.error({
      requestId,
      statusCode: status,
      method: request.method,
      path: request.url,
      message:
        typeof message === 'string'
          ? message
          : ((message as Record<string, unknown>)?.['message'] ?? message),
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      message:
        typeof message === 'string'
          ? message
          : ((message as Record<string, unknown>)?.['message'] ?? message),
    });
  }
}
