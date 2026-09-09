import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { AuditInterceptor } from '../../../backend/src/audit/audit.interceptor';
import { AuditAction, AuditResourceType } from '../../../backend/src/audit/audit.decorator';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: any;
  let auditLogService: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    auditLogService = {
      create: jest.fn(),
    };

    interceptor = new AuditInterceptor(reflector, auditLogService);
  });

  it('should not create audit log when no audit metadata is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const next = {
      handle: jest.fn(() => of({ id: '1' })),
    } as unknown as CallHandler;
    const context = createMockContext({});
    const result = interceptor.intercept(context, next);
    expect(result).toBeDefined();
    await result.subscribe();
    expect(next.handle).toHaveBeenCalled();
    expect(auditLogService.create).not.toHaveBeenCalled();
  });

  it('should create audit log when metadata is present', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'auditAction') return 'CREATE';
      if (key === 'auditResourceType') return 'User';
      return undefined;
    });
    auditLogService.create.mockResolvedValue(undefined);
    const next = {
      handle: jest.fn(() => of({ id: '1' })),
    } as unknown as CallHandler;
    const context = createMockContext({
      user: { sub: 'user-1', schoolId: 'school-1' },
      params: { id: '1' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    });

    const result = interceptor.intercept(context, next);
    expect(result).toBeDefined();
    await result.subscribe();
    expect(auditLogService.create).toHaveBeenCalledWith({
      action: 'CREATE',
      resourceType: 'User',
      resourceId: '1',
      newValues: { id: '1' },
      schoolId: 'school-1',
      actorId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });
  });
});

function createMockContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

describe('Audit decorators', () => {
  it('AuditAction should be applicable as method decorator', () => {
    @AuditAction('CREATE')
    class Dummy {}
    expect(Dummy).toBeDefined();
  });

  it('AuditResourceType should be applicable as method decorator', () => {
    @AuditResourceType('User')
    class Dummy {}
    expect(Dummy).toBeDefined();
  });
});
