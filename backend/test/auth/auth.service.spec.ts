import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { UserRole } from '@prisma/client';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let configService: any;

  const mockPrisma: any = {
    user: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt: any = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig: any = {
    get: jest.fn(),
  };

  const mockAuditLog = {
    create: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$testHash',
    firstName: 'Test',
    lastName: 'User',
    role: 'SCHOOL_ADMIN' as UserRole,
    status: 'ACTIVE',
    schoolId: 'school-1',
  };

  const superAdminUser = { ...mockUser, role: 'SUPER_ADMIN' as UserRole };
  const principalUser = { ...mockUser, role: 'PRINCIPAL' as UserRole };
  const teacherUser = { ...mockUser, role: 'TEACHER' as UserRole };
  const studentUser = { ...mockUser, role: 'STUDENT' as UserRole };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.passwordHash);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when user is not active', async () => {
      const inactiveUser = { ...mockUser, status: 'SUSPENDED' };
      prismaService.user.findFirst.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('test@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const user = { ...mockUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, undefined);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: user.id,
          token: 'refresh-token',
          expiresAt: expect.any(Date),
        }),
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          schoolId: user.schoolId,
        }),
        availableRoles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
        requiresRoleSelection: true,
      });
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const storedToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'old-refresh-token',
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      };
      prismaService.refreshToken.findUnique.mockResolvedValue(storedToken);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.refreshTokens('old-refresh-token');

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'old-refresh-token' },
        include: { user: true },
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: storedToken.id },
        data: {
          token: 'new-refresh-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        userId: 'user-123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 86400000),
        user: mockUser,
      };
      prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete the refresh token', async () => {
      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('refresh-token');

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'refresh-token' },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('forgotPassword', () => {
    it('should return message and create token when user exists', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'reset-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const result = await service.forgotPassword('test@example.com');

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
      expect(prismaService.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
      expect(result).toEqual({
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    });

    it('should return same message when user does not exist', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(prismaService.user.findFirst).toHaveBeenCalled();
      expect(prismaService.passwordResetToken.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      const resetToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'valid-reset-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
        user: mockUser,
      };
      prismaService.passwordResetToken.findUnique.mockResolvedValue(resetToken);
      prismaService.$transaction.mockImplementation(async (cb: any) => cb(prismaService));
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const result = await service.resetPassword('valid-reset-token', 'newPassword123');

      expect(prismaService.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-reset-token' },
        include: { user: true },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          passwordHash: 'new-hashed-password',
          passwordChangedAt: expect.any(Date),
        }),
      });
      expect(prismaService.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: resetToken.id },
        data: { usedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Password has been reset successfully' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'newPassword123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000),
        usedAt: null,
        user: mockUser,
      };
      prismaService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

      await expect(service.resetPassword('expired-token', 'newPassword123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for already used token', async () => {
      const usedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: 'used-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(),
        user: mockUser,
      };
      prismaService.passwordResetToken.findUnique.mockResolvedValue(usedToken);

      await expect(service.resetPassword('used-token', 'newPassword123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAvailableRoles', () => {
    it('should return all roles for SUPER_ADMIN', () => {
      const roles = service.getAvailableRoles('SUPER_ADMIN');
      expect(roles).toEqual(['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
    });

    it('should return permitted roles for PRINCIPAL', () => {
      const roles = service.getAvailableRoles('PRINCIPAL');
      expect(roles).toEqual(['PRINCIPAL', 'TEACHER', 'STUDENT']);
    });

    it('should return permitted roles for SCHOOL_ADMIN', () => {
      const roles = service.getAvailableRoles('SCHOOL_ADMIN');
      expect(roles).toEqual(['SCHOOL_ADMIN', 'TEACHER', 'STUDENT']);
    });

    it('should return permitted roles for TEACHER', () => {
      const roles = service.getAvailableRoles('TEACHER');
      expect(roles).toEqual(['TEACHER', 'STUDENT']);
    });

    it('should return only own role for STUDENT', () => {
      const roles = service.getAvailableRoles('STUDENT');
      expect(roles).toEqual(['STUDENT']);
    });
  });

  describe('login with selectedRole', () => {
    it('should accept valid selectedRole for SCHOOL_ADMIN user', async () => {
      const user = { ...mockUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, 'TEACHER');

      expect(result.user.role).toBe('TEACHER');
      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({ role: 'TEACHER' }));
    });

    it('should use default role when selectedRole is not provided', async () => {
      const user = { ...mockUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, undefined);

      expect(result.user.role).toBe('SCHOOL_ADMIN');
    });

    it('should throw BadRequestException for incompatible selectedRole for SCHOOL_ADMIN', async () => {
      const user = { ...mockUser, passwordHash: undefined };

      await expect(service.login(user, 'PRINCIPAL')).rejects.toThrow(BadRequestException);
      await expect(service.login(user, 'SUPER_ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should accept compatible selectedRole for SCHOOL_ADMIN user', async () => {
      const user = { ...mockUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, 'STUDENT');

      expect(result.user.role).toBe('STUDENT');
    });

    it('should allow STUDENT to select STUDENT role', async () => {
      const user = { ...studentUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, 'STUDENT');

      expect(result.user.role).toBe('STUDENT');
    });

    it('should reject incompatible selectedRole for TEACHER', async () => {
      const user = { ...teacherUser, passwordHash: undefined };

      await expect(service.login(user, 'SCHOOL_ADMIN')).rejects.toThrow(BadRequestException);
      await expect(service.login(user, 'PRINCIPAL')).rejects.toThrow(BadRequestException);
      await expect(service.login(user, 'SUPER_ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should accept compatible selectedRole for TEACHER user', async () => {
      const user = { ...teacherUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, 'STUDENT');

      expect(result.user.role).toBe('STUDENT');
    });

    it('should allow SUPER_ADMIN to select any role', async () => {
      const user = { ...superAdminUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const validRoles: UserRole[] = ['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'];
      
      for (const role of validRoles) {
        const result = await service.login(user, role);
        expect(result.user.role).toBe(role);
        jest.clearAllMocks();
        jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      }
    });

    it('should reject incompatible selectedRole for PRINCIPAL', async () => {
      const user = { ...principalUser, passwordHash: undefined };

      await expect(service.login(user, 'SUPER_ADMIN')).rejects.toThrow(BadRequestException);
      await expect(service.login(user, 'SCHOOL_ADMIN')).rejects.toThrow(BadRequestException);
    });

    it('should accept compatible selectedRole for PRINCIPAL user', async () => {
      const user = { ...principalUser, passwordHash: undefined };
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      configService.get.mockReturnValue('refresh-secret');

      const result = await service.login(user, 'STUDENT');

      expect(result.user.role).toBe('STUDENT');
    });
  });
});
