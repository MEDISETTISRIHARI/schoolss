import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from '../../src/common/guards/tenant.guard';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { SCHOOL_ID_KEY, PUBLIC_KEY } from '../../src/common/decorators/roles.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let prismaService: any;
  let reflector: any;

  const mockPrismaService: any = {
    school: {
      findUnique: jest.fn(),
    },
  };

  const mockReflector: any = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    prismaService = module.get(PrismaService);
    reflector = module.get(Reflector);
  });

  const mockContext = (user: any, schoolIdRequired = false) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: user,
        school: null,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for public routes', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return true;
      if (key === SCHOOL_ID_KEY) return false;
      return null;
    });

    const result = await guard.canActivate(mockContext({ sub: 'user-1', role: 'TEACHER' }) as any);
    expect(result).toBe(true);
  });

  it('should return true when school ID is not required', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return false;
      return null;
    });

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'TEACHER', schoolId: 'school-1' }) as any,
    );
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when user is not authenticated', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    await expect(guard.canActivate(mockContext(null) as any)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow SUPER_ADMIN without checking school', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'SUPER_ADMIN', schoolId: 'school-1' }) as any,
    );
    expect(result).toBe(true);
  });

  it('should throw BadRequestException when school ID is missing', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    await expect(
      guard.canActivate(mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: null }) as any),
    ).rejects.toThrow(BadRequestException);
    await expect(
      guard.canActivate(mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: null }) as any),
    ).rejects.toThrow('School context required');
  });

  it('should verify school is active', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    mockPrismaService.school.findUnique.mockResolvedValue({ id: 'school-1', isActive: true });

    const result = await guard.canActivate(
      mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: 'school-1' }) as any,
    );
    expect(result).toBe(true);
    expect(prismaService.school.findUnique).toHaveBeenCalledWith({
      where: { id: 'school-1' },
      select: { id: true, isActive: true },
    });
  });

  it('should throw BadRequestException when school is not found', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    mockPrismaService.school.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: 'school-1' }) as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when school is inactive', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === PUBLIC_KEY) return false;
      if (key === SCHOOL_ID_KEY) return true;
      return null;
    });

    mockPrismaService.school.findUnique.mockResolvedValue({ id: 'school-1', isActive: false });

    await expect(
      guard.canActivate(mockContext({ sub: 'user-1', role: 'SCHOOL_ADMIN', schoolId: 'school-1' }) as any),
    ).rejects.toThrow(BadRequestException);
  });
});
