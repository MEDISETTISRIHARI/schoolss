import { ExecutionContext, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../backend/src/common/prisma/prisma.service';
import { TenantGuard } from '../../../../backend/src/common/guards/tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: any;
  let prismaService: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    prismaService = {
      school: {
        findUnique: jest.fn(),
      },
    };

    guard = new TenantGuard(reflector, prismaService);
  });

  it('should allow public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should allow when school is not required', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return false;
      return undefined;
    });
    const context = createMockContext({ sub: '1', role: 'TEACHER' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when user is not authenticated', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    const context = createMockContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow SUPER_ADMIN without school', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    const context = createMockContext({ sub: '1', role: 'SUPER_ADMIN' });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when schoolId is missing for non-super-admin', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    const context = createMockContext({ sub: '1', role: 'TEACHER', schoolId: undefined });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw when school is not found', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    prismaService.school.findUnique.mockResolvedValue(null);
    const context = createMockContext({ sub: '1', role: 'TEACHER', schoolId: 'school-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should throw when school is inactive', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    prismaService.school.findUnique.mockResolvedValue({ id: 'school-1', isActive: false });
    const context = createMockContext({ sub: '1', role: 'TEACHER', schoolId: 'school-1' });
    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it('should attach school to request when school is active', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'isPublic') return false;
      if (key === 'schoolId') return true;
      return undefined;
    });
    const school = { id: 'school-1', isActive: true };
    prismaService.school.findUnique.mockResolvedValue(school);
    const req: any = { user: { sub: '1', role: 'TEACHER', schoolId: 'school-1' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(req.school).toEqual(school);
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
