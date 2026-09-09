import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuthService } from '../../../backend/src/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
    schoolId: 'school-1',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    service = new AuthService(prisma, jwtService, configService);
  });

  describe('validateUser', () => {
    it('should return null when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false as any);
      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should throw when account is not active', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, status: 'SUSPENDED' });
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as any);
      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user when credentials are valid', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as any);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should return access token and refresh token', async () => {
      jwtService.sign.mockReturnValue('access-token' as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);
      const result = await service.login(mockUser as any);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('access-token');
      expect(result.user).toBeDefined();
    });
  });

  describe('refreshTokens', () => {
    it('should throw when refresh token is invalid', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refreshTokens('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens when refresh token is valid', async () => {
      jwtService.sign.mockReturnValue('new-token' as any);
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        token: 'old-refresh',
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      prisma.refreshToken.update.mockResolvedValue({} as any);
      const result = await service.refreshTokens('old-refresh');
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 } as any);
      const result = await service.logout('some-token');
      expect(result.message).toBe('Logged out successfully');
    });
  });
});
