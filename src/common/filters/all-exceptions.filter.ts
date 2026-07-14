import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resPayload: any = exception.getResponse();

      if (typeof resPayload === 'object' && resPayload !== null) {
        code = resPayload.code || 'HTTP_ERROR';
        message = resPayload.message || exception.message;
        details = resPayload.details || undefined;
      } else {
        message = exception.message || String(resPayload);
      }
    } else {
      // Log stack trace for unhandled errors
      this.logger.error('Unhandled Exception occurred during request processing', exception instanceof Error ? exception.stack : exception);
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        statusCode,
        path: request.url,
        timestamp: new Date().toISOString(),
        ...(details ? { details } : {}),
      },
    };

    response.status(statusCode).json(errorResponse);
  }
}