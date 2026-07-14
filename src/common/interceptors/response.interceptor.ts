import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    // Check if the response is a stream or file download (like CSV export)
    const headers = response.getHeaders ? response.getHeaders() : {};
    const contentType = headers['content-type'] || '';
    if (contentType.includes('text/csv') || contentType.includes('application/pdf')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in the success format, return it
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        // If it's a paginated result with properties: { data: [...], meta: {...} }
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
          };
        }

        // Otherwise, wrap it
        return {
          success: true,
          data: data === undefined ? null : data,
        };
      }),
    );
  }
}