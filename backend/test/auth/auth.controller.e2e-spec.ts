import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as supertest from 'supertest';
const request = (supertest as any).default ?? (supertest as any);
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { LocalStrategy } from '../../src/auth/strategies/local.strategy';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@school-management/shared-types';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: any;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getAvailableRoles: jest.fn(),
  };

  const mockAuditLogService = {
    create: jest.fn(),
  };

  const mockPrismaService = {
    user: { findFirst: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
    passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRY') return '7d';
      return null;
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '15m' } }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LocalStrategy, useFactory: () => new LocalStrategy(mockAuthService as any) },
        { provide: JwtStrategy, useFactory: () => new JwtStrategy(mockConfigService as any) },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/v1/auth/login', () => {
    it('should return tokens on successful login', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: undefined,
        firstName: 'Test',
        lastName: 'User',
        role: 'SCHOOL_ADMIN',
        schoolId: 'school-1',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'SCHOOL_ADMIN',
          schoolId: 'school-1',
        },
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.refreshToken).toBe('refresh-token-123');
          expect(res.body.data.user.email).toBe('test@example.com');
          expect(res.body.error).toBeNull();
        });
    });

    it('should handle invalid credentials', () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'bad@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh', () => {
    it('should return new tokens on valid refresh', () => {
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.accessToken).toBe('new-access-token');
          expect(res.body.error).toBeNull();
        });
    });

    it('should handle invalid refresh token', () => {
      mockAuthService.refreshTokens.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/api/v1/auth/logout', () => {
    it('should logout successfully', () => {
      mockAuthService.logout.mockResolvedValue({ message: 'Logged out successfully' });

      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBe('Logged out successfully');
          expect(res.body.error).toBeNull();
        });
    });
  });

  describe('/api/v1/auth/forgot-password', () => {
    it('should return success message', () => {
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'If an account with that email exists, a password reset link has been sent',
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBe('If an account with that email exists, a password reset link has been sent');
        });
    });

    it('should handle invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });
  });

  describe('/api/v1/auth/reset-password', () => {
    it('should return success message on valid reset', () => {
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password has been reset successfully',
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid-reset-token', newPassword: 'newPassword123' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toBe('Password has been reset successfully');
        });
    });

    it('should handle invalid reset token', () => {
      mockAuthService.resetPassword.mockRejectedValue(new BadRequestException('Invalid password reset token'));

      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newPassword123' })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });

    it('should handle short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'short' })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });
  });

  describe('/api/v1/auth/roles', () => {
    it('should return available roles for a valid role', () => {
      mockAuthService.getAvailableRoles.mockReturnValue(['SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);

      return request(app.getHttpServer())
        .post('/api/v1/auth/roles')
        .send({ role: 'SCHOOL_ADMIN' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.availableRoles).toEqual(['SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
        });
    });

    it('should return all roles for SUPER_ADMIN', () => {
      mockAuthService.getAvailableRoles.mockReturnValue(['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);

      return request(app.getHttpServer())
        .post('/api/v1/auth/roles')
        .send({ role: 'SUPER_ADMIN' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.availableRoles).toEqual(['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
        });
    });

    it('should return permitted roles for TEACHER', () => {
      mockAuthService.getAvailableRoles.mockReturnValue(['TEACHER', 'STUDENT']);

      return request(app.getHttpServer())
        .post('/api/v1/auth/roles')
        .send({ role: 'TEACHER' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.availableRoles).toEqual(['TEACHER', 'STUDENT']);
        });
    });

    it('should return only own role for STUDENT', () => {
      mockAuthService.getAvailableRoles.mockReturnValue(['STUDENT']);

      return request(app.getHttpServer())
        .post('/api/v1/auth/roles')
        .send({ role: 'STUDENT' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.availableRoles).toEqual(['STUDENT']);
        });
    });
  });

  describe('/api/v1/auth/login with selectedRole', () => {
    it('should accept login with valid selectedRole', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: undefined,
        firstName: 'Test',
        lastName: 'User',
        role: 'SCHOOL_ADMIN',
        schoolId: 'school-1',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'TEACHER',
          schoolId: 'school-1',
        },
        availableRoles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
        requiresRoleSelection: true,
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123', selectedRole: 'TEACHER' })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user.role).toBe('TEACHER');
          expect(res.body.data.availableRoles).toEqual(['SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
          expect(res.body.data.requiresRoleSelection).toBe(true);
        });
    });
  });
});
