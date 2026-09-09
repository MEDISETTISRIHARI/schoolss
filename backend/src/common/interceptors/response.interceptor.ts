import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_ENVELOPE_KEY } from '../decorators/roles.decorator';

export interface ResponseEnvelope {
  success: boolean;
  data: unknown;
  meta: Record<string, unknown> | null;
  error: string | null;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope> {
    const request = context.switchToHttp().getRequest();
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipEnvelope) {
      return next.handle() as Observable<ResponseEnvelope>;
    }

    return next.handle().pipe(
      map((data: unknown) => {
        const meta: Record<string, unknown> | null =
          Array.isArray(data) && request.query
            ? {
                page: parseInt(request.query.page, 10) || 1,
                limit: parseInt(request.query.limit, 10) || data.length,
                total: data.length,
              }
            : null;

        return {
          success: true,
          data,
          meta,
          error: null,
        };
      }),
    );
  }
}
