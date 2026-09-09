import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../../../backend/src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: any;
  let jwtService: any;
  let configService: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    jwtService = {
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    guard = new JwtAuthGuard(jwtService, configService, reflector);
  });

  it('should allow public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw when no token is provided', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('No token provided');
  });

  it('should throw when token is invalid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    configService.get.mockReturnValue('secret');
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalid-token' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid or expired token');
  });

  it('should attach user payload to request when token is valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    configService.get.mockReturnValue('secret');
    const payload = { sub: '1', email: 'a@b.com', role: 'STUDENT' };
    jwtService.verify.mockReturnValue(payload);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer valid-token' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
});
