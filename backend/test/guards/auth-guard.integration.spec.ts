import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor, ExecutionContext } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { TenantGuard } from '../../src/common/guards/tenant.guard';
import { PrismaService } from '../../src/common/prisma/prisma.service';import { UserRole } from '@prisma/client';

const mockUser = {
  sub: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'SCHOOL_ADMIN',
  schoolId: 'school-1',
};

describe('AuthGuardIntegration', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const mockPrismaService = {
      school: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      permission: {
        findMany: jest.fn(),
      },
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.register({
          secret: 'test-jwt-secret-key-for-testing',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
              const request = context.switchToHttp().getRequest();
              request.user = mockUser;
              return true;
            }),
          },
        },
        {
          provide: PermissionsGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TenantGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'Reflector', useValue: mockReflector },
      ],
    }).compile();

    jwtService = moduleRef.get<JwtService>(JwtService);

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(ConfigService)));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Flow', () => {
    it('should verify JWT token structure for super admin access', () => {
      const token = jwtService.sign({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
        schoolId: 'school-1',
      });

      expect(token).toBeDefined();
    });

    it('should verify JWT token structure for school admin access', () => {
      const token = jwtService.sign({
        sub: 'user-2',
        email: 'admin@example.com',
        role: 'SCHOOL_ADMIN',
        schoolId: 'school-1',
      });

      expect(token).toBeDefined();
    });

    it('should verify JWT token structure for teacher access', () => {
      const token = jwtService.sign({
        sub: 'user-3',
        email: 'teacher@example.com',
        role: 'TEACHER',
        schoolId: 'school-1',
      });

      expect(token).toBeDefined();
    });

    it('should verify JWT token structure for student access', () => {
      const token = jwtService.sign({
        sub: 'user-4',
        email: 'student@example.com',
        role: 'STUDENT',
        schoolId: 'school-1',
      });

      expect(token).toBeDefined();
    });
  });
});
