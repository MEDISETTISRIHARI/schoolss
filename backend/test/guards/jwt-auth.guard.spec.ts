import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PUBLIC_KEY } from '../../src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: any;
  let configService: any;
  let reflector: any;

  const mockJwtService: any = {
    verify: jest.fn(),
  };

  const mockConfigService: any = {
    get: jest.fn(),
  };

  const mockReflector: any = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-token',
        },
        user: null,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    reflector = module.get(Reflector);
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            user: null,
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret');
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token', { secret: 'secret' });
    });

    it('should set user on request when token is valid', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('secret');
      const mockPayload = { sub: 'user-1', email: 'test@example.com', role: 'SCHOOL_ADMIN', schoolId: 'school-1' };
      jwtService.verify.mockReturnValue(mockPayload);

      const request: any = { headers: { authorization: 'Bearer valid-token' }, user: null };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockPayload);
    });
  });
});
