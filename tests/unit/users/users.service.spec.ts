import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../backend/src/users/users.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            school: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'TEACHER', schoolId: 'school-1', status: 'ACTIVE' };
      prisma.school.findFirst.mockResolvedValue({ id: 'school-1' } as any);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed' as never);

      const result = await service.create('actor-1', { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User', role: 'TEACHER' }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.school.findFirst.mockResolvedValue({ id: 'school-1' } as any);
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.create('actor-1', { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User', role: 'TEACHER' }, { role: 'SCHOOL_ADMIN', schoolId: 'school-1' })).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findOne', () => {
    it('should return a user for SUPER_ADMIN', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'TEACHER', schoolId: 'school-1', status: 'ACTIVE' };
      prisma.user.findFirst.mockResolvedValue(mockUser as any);

      const result = await service.findOne('user-1', { role: 'SUPER_ADMIN' });

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', { role: 'SUPER_ADMIN' })).rejects.toThrow('User not found');
    });

    it('should throw ForbiddenException if accessing another school user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'TEACHER', schoolId: 'school-1', status: 'ACTIVE' };
      prisma.user.findFirst.mockResolvedValue(mockUser as any);

      await expect(service.findOne('user-1', { role: 'SCHOOL_ADMIN', schoolId: 'school-2' })).rejects.toThrow('Access denied to this user');
    });
  });
});
