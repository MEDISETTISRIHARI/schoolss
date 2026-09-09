import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SchoolsService } from '../../src/schools/schools.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { UserRole } from '@prisma/client';

describe('SchoolsService', () => {
  let service: SchoolsService;
  let prismaService: any;

  const mockSchool = {
    id: 'school-1',
    name: 'Test School',
    subdomain: 'test',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test St',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        {
          provide: PrismaService,
          useValue: {
            school: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        { provide: AuditLogService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
    prismaService = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a school', async () => {
      prismaService.school.create.mockResolvedValue(mockSchool);

      const result = await service.create('actor-1', {
        name: 'Test School',
        subdomain: 'test',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        isActive: true,
      });

      expect(prismaService.school.create).toHaveBeenCalledWith({
        data: {
          name: 'Test School',
          subdomain: 'test',
          email: 'test@example.com',
          phone: '1234567890',
          address: '123 Test St',
          isActive: true,
        },
      });
      expect(result).toEqual(mockSchool);
    });

    it('should default isActive to true', async () => {
      prismaService.school.create.mockResolvedValue({ ...mockSchool, isActive: true });

      await service.create('actor-1', {
        name: 'Test School',
        subdomain: 'test',
      });

      expect(prismaService.school.create).toHaveBeenCalledWith({
        data: {
          name: 'Test School',
          subdomain: 'test',
          isActive: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all schools for SUPER_ADMIN', async () => {
      prismaService.school.findMany.mockResolvedValue([mockSchool]);

      const result = await service.findAll({ role: 'SUPER_ADMIN' as UserRole });

      expect(prismaService.school.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockSchool]);
    });

    it('should return only own school for regular users', async () => {
      prismaService.school.findMany.mockResolvedValue([mockSchool]);

      const result = await service.findAll({ role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(prismaService.school.findMany).toHaveBeenCalledWith({
        where: { id: 'school-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockSchool]);
    });

    it('should throw ForbiddenException when school ID is missing for non-super-admin', async () => {
      await expect(service.findAll({ role: 'TEACHER' as UserRole })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return school when found and authorized', async () => {
      prismaService.school.findFirst.mockResolvedValue(mockSchool);

      const result = await service.findOne('school-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(result).toEqual(mockSchool);
    });

    it('should throw NotFoundException when school does not exist', async () => {
      prismaService.school.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another school', async () => {
      prismaService.school.findFirst.mockResolvedValue(mockSchool);

      await expect(
        service.findOne('school-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-2' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to access any school', async () => {
      prismaService.school.findFirst.mockResolvedValue(mockSchool);

      const result = await service.findOne('school-1', { role: 'SUPER_ADMIN' as UserRole });

      expect(result).toEqual(mockSchool);
    });
  });

  describe('update', () => {
    it('should update school when authorized', async () => {
      const updatedSchool = { ...mockSchool, name: 'Updated School' };
      prismaService.school.findFirst.mockResolvedValue(mockSchool);
      prismaService.school.update.mockResolvedValue(updatedSchool);

      const result = await service.update('school-1', 'actor-1', { name: 'Updated School' }, {
        role: 'SCHOOL_ADMIN' as UserRole,
        schoolId: 'school-1',
      });

      expect(prismaService.school.update).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        data: { name: 'Updated School' },
      });
      expect(result).toEqual(updatedSchool);
    });
  });

  describe('activate', () => {
    it('should throw ForbiddenException for non-super-admin', async () => {
      await expect(
        service.activate('school-1', 'actor-1', { role: 'SCHOOL_ADMIN' as UserRole }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should activate an inactive school', async () => {
      const inactiveSchool = { ...mockSchool, isActive: false };
      prismaService.school.findFirst.mockResolvedValue(inactiveSchool);
      prismaService.school.update.mockResolvedValue({ ...inactiveSchool, isActive: true });

      const result = await service.activate('school-1', 'actor-1', { role: 'SUPER_ADMIN' as UserRole });

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException when school does not exist', async () => {
      prismaService.school.findFirst.mockResolvedValue(null);

      await expect(
        service.activate('non-existent', 'actor-1', { role: 'SUPER_ADMIN' as UserRole }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should throw ForbiddenException for non-super-admin', async () => {
      await expect(
        service.deactivate('school-1', 'actor-1', { role: 'SCHOOL_ADMIN' as UserRole }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deactivate an active school', async () => {
      prismaService.school.findFirst.mockResolvedValue(mockSchool);
      prismaService.school.update.mockResolvedValue({ ...mockSchool, isActive: false });

      const result = await service.deactivate('school-1', 'actor-1', { role: 'SUPER_ADMIN' as UserRole });

      expect(result.isActive).toBe(false);
    });
  });
});
