import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { PERMISSIONS_KEY, ROLES_KEY, PUBLIC_KEY } from '../../src/common/decorators/roles.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let prismaService: any;
  let reflector: any;

  const mockPrismaService: any = {
    permission: {
      findMany: jest.fn(),
    },
  };

  const mockReflector: any = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    prismaService = module.get(PrismaService);
    reflector = module.get(Reflector);
  });

  const mockContext = (user: any, handlerMeta: { public?: boolean; roles?: string[]; permissions?: string[] } = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: user,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  });

  it('should return true for public routes', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return true;
      return null;
    });

    const result = await guard.canActivate(mockContext({ sub: 'user-1', role: 'TEACHER' }) as any);
    expect(result).toBe(true);
  });

  it('should return true when no permissions or roles are required', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return null;
      if (key === ROLES_KEY) return null;
      return null;
    });

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'TEACHER', schoolId: 'school-1' }) as any,
    );
    expect(result).toBe(true);
  });

  it('should allow SUPER_ADMIN to pass role check when role is in required roles', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['SUPER_ADMIN'];
      if (key === PERMISSIONS_KEY) return ['schools.manage'];
      return null;
    });

    prismaService.permission.findMany.mockResolvedValue([{ name: '*' }]);

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'SUPER_ADMIN' }) as any,
    );
    expect(result).toBe(true);
    expect(prismaService.permission.findMany).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when user lacks required role', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return null;
    });

    await expect(
      guard.canActivate(mockContext({ sub: 'user-1', role: 'TEACHER' }) as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException when user is not authenticated', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['some.permission'];
      return null;
    });

    await expect(guard.canActivate(mockContext(null) as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should check permissions from database for non-super-admin users', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['students.manage'];
      return null;
    });

    prismaService.permission.findMany.mockResolvedValue([
      { name: 'students.manage' },
      { name: 'students.view' },
    ]);

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: 'school-1' }) as any,
    );
    expect(result).toBe(true);
    expect(prismaService.permission.findMany).toHaveBeenCalledWith({
      where: {
        rolePermissions: {
          some: {
            role: 'SCHOOL_ADMIN',
          },
        },
      },
      select: { name: true },
    });
  });

  it('should throw BadRequestException when user lacks required permissions', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === PERMISSIONS_KEY) return ['schools.manage'];
      return null;
    });

    prismaService.permission.findMany.mockResolvedValue([
      { name: 'students.view' },
      { name: 'attendance.enter.assigned' },
    ]);

    await expect(
      guard.canActivate(
        mockContext({ sub: 'user-1', role: 'TEACHER', schoolId: 'school-1' }) as any,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      guard.canActivate(
        mockContext({ sub: 'user-1', role: 'TEACHER', schoolId: 'school-1' }) as any,
      ),
    ).rejects.toThrow('Insufficient permissions');
  });
});
