import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit.service';
import { AUDIT_ACTION_KEY, AUDIT_RESOURCE_TYPE_KEY } from './audit.decorator';

interface AuditableRequest extends Request {
  user?: { schoolId?: string; sub?: string };
  params?: Record<string, string>;
  ip?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector, private auditLogService: AuditLogService, @Optional() private request?: Request) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string | undefined>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const resourceType = this.reflector.getAllAndOverride<string | undefined>(AUDIT_RESOURCE_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action || !resourceType) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response: unknown) => {
        const http = context.switchToHttp();
        const req = http.getRequest<AuditableRequest>();
        const user = req.user;
        const responseRecord = response as Record<string, unknown> | undefined;
        const resourceId = (responseRecord?.id as string | undefined) ?? req.params?.id;

        await this.auditLogService.create({
          action,
          resourceType,
          resourceId,
          newValues: response,
          schoolId: user?.schoolId,
          actorId: user?.sub,
          ipAddress: req.ip,
          userAgent: (req.headers as unknown as Record<string, string>)['user-agent'],
        });
      }),
    );
  }
}
