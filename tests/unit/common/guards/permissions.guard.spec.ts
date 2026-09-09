import { ExecutionContext, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../backend/src/common/prisma/prisma.service';
import { PermissionsGuard } from '../../../../backend/src/common/guards/permissions.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: any;
  let prismaService: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    prismaService = {
      permission: {
        findMany: jest.fn(),
      },
    };

    guard = new PermissionsGuard(reflector, prismaService);
  });

  it('should allow public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when user is not authenticated and permissions are required', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return ['users.view'];
      return [];
    });
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow when no permissions or roles required', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({ sub: '1', role: 'STUDENT' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when required role does not match', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'roles') return ['SUPER_ADMIN'];
      return [];
    });
    const context = createMockContext({ sub: '1', role: 'STUDENT' });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should allow SUPER_ADMIN all permissions', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return ['school.manage'];
      return [];
    });
    const context = createMockContext({ sub: '1', role: 'SUPER_ADMIN' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow when user has required permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return ['users.view'];
      return [];
    });
    prismaService.permission.findMany.mockResolvedValue([{ name: 'users.view' }]);

    const context = createMockContext({ sub: '1', role: 'TEACHER' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when user lacks required permission', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'permissions') return ['school.manage'];
      return [];
    });
    prismaService.permission.findMany.mockResolvedValue([{ name: 'users.view' }]);

    const context = createMockContext({ sub: '1', role: 'TEACHER' });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });
});

function createMockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}
