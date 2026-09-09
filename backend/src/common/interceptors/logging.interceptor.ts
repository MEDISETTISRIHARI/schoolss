import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLoggerService } from '../logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers?.['user-agent'] || 'unknown';
    const requestId = headers?.['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startTime = Date.now();

    const isHealth = url === '/health' || url === '/ready';
    if (!isHealth) {
      this.logger.info('Incoming request', 'HTTP', {
        requestId,
        method,
        url,
        ip,
        userAgent,
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          if (!isHealth) {
            this.logger.info('Outgoing response', 'HTTP', {
              requestId,
              method,
              url,
              statusCode: response.statusCode,
              durationMs: duration,
            });
          }
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error('Request failed', err.stack, 'HTTP', {
            requestId,
            method,
            url,
            statusCode: response.statusCode || 500,
            durationMs: duration,
          });
        },
      }),
    );
  }
}
