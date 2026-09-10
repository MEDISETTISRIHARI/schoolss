import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SentryService } from '../sentry/sentry.service';
import { WinstonLoggerService } from '../logger';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly sentry: SentryService, private readonly logger: WinstonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    this.sentry.init();
    return next.handle().pipe(
      tap({
        error: (err: Error) => {
          if (err instanceof HttpException) {
            const status = err.getStatus();
            if (status >= 500) {
              this.sentry.captureException(err);
              this.logger.error('Unhandled exception', err.stack, 'Sentry');
            }
          } else {
            this.sentry.captureException(err);
            this.logger.error('Unhandled exception', err.stack, 'Sentry');
          }
        },
      }),
    );
  }
}
