import { Test, TestingModule } from '@nestjs/testing';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor';
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { Reflector } from '@nestjs/core';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseInterceptor,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response in envelope', (done) => {
    const mockRequest = { query: {} };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const mockData = { id: '1', name: 'Test' };
    const next = {
      handle: () => of(mockData),
    };

    reflector.getAllAndOverride.mockReturnValue(false);

    interceptor.intercept(mockContext, next).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { id: '1', name: 'Test' },
        meta: null,
        error: null,
      });
      done();
    });
  });

  it('should add pagination meta for arrays with query params', (done) => {
    const mockRequest = { query: { page: '1', limit: '10' } };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const mockData = [{ id: '1' }, { id: '2' }];
    const next = {
      handle: () => of(mockData),
    };

    reflector.getAllAndOverride.mockReturnValue(false);

    interceptor.intercept(mockContext, next).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: [{ id: '1' }, { id: '2' }],
        meta: { page: 1, limit: 10, total: 2 },
        error: null,
      });
      done();
    });
  });

  it('should skip envelope when @SkipEnvelope is applied', (done) => {
    const mockRequest = { query: {} };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    const mockData = { raw: 'response' };
    const next = {
      handle: () => of(mockData),
    };

    reflector.getAllAndOverride.mockReturnValue(true);

    interceptor.intercept(mockContext, next).subscribe((result) => {
      expect(result).toEqual(mockData);
      done();
    });
  });
});
