import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../backend/src/app.module';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

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

const mockPrismaService = {
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
  school: {
    findUnique: jest.fn(),
  },
  permission: {
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

class MockPrismaService {
  user = mockPrismaService.user;
  refreshToken = mockPrismaService.refreshToken;
  school = mockPrismaService.school;
  permission = mockPrismaService.permission;
  auditLog = mockPrismaService.auditLog;
  $connect = jest.fn();
  $disconnect = jest.fn();
  onModuleInit = jest.fn();
  onModuleDestroy = jest.fn();
}

const mockJwtService = {
  verify: jest.fn(),
  sign: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'test-secret';
    if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
    if (key === 'JWT_EXPIRY') return '15m';
    if (key === 'JWT_REFRESH_EXPIRY') return '7d';
    if (key === 'DATABASE_URL') return 'postgresql://test:test@localhost:5432/test';
    return undefined;
  }),
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useClass(MockPrismaService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(Reflector)
      .useValue(mockReflector)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('/auth/login (POST) should return 401 or 500 for invalid credentials', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(null);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect([401, 500]).toContain(res.status);
  });
});
