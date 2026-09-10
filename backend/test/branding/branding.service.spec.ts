import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BrandingService } from '../../src/branding/branding.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuditLogService } from '../../src/audit/audit.service';
import { UserRole } from '@school-management/shared-types';

describe('BrandingService', () => {
  let service: BrandingService;
  let prismaService: any;
  let auditLogService: any;

  const baseSchool = {
    id: 'school-1',
    publicId: 'school-public-1',
    name: 'Test School',
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#FF0000',
    secondaryColor: '#00FF00',
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandingService,
        {
          provide: PrismaService,
          useValue: {
            school: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        { provide: AuditLogService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<BrandingService>(BrandingService);
    prismaService = module.get(PrismaService);
    auditLogService = module.get(AuditLogService);
  });

  describe('getBranding', () => {
    it('should return branding fields when school is found and authorized', async () => {
      prismaService.school.findFirst.mockResolvedValue(baseSchool);

      const result = await service.getBranding('school-public-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(result).toEqual({
        publicId: 'school-public-1',
        name: 'Test School',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      });
    });

    it('should throw NotFoundException when school does not exist', async () => {
      prismaService.school.findFirst.mockResolvedValue(null);

      await expect(
        service.getBranding('non-existent', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another school', async () => {
      prismaService.school.findFirst.mockResolvedValue(baseSchool);

      await expect(
        service.getBranding('school-public-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-2' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to access any school branding', async () => {
      prismaService.school.findFirst.mockResolvedValue(baseSchool);

      const result = await service.getBranding('school-public-1', { role: 'SUPER_ADMIN' as UserRole });

      expect(result.publicId).toBe('school-public-1');
      expect(result.name).toBe('Test School');
    });
  });

  describe('updateBranding', () => {
    it('should update branding fields when authorized', async () => {
      const updated = {
        ...baseSchool,
        logoUrl: 'https://example.com/new-logo.png',
        primaryColor: '#0000FF',
        secondaryColor: '#FFFF00',
      };
      prismaService.school.findFirst.mockResolvedValue(baseSchool);
      prismaService.school.update.mockResolvedValue(updated);

      const result = await service.updateBranding(
        'school-public-1',
        'actor-1',
        {
          logoUrl: 'https://example.com/new-logo.png',
          primaryColor: '#0000FF',
          secondaryColor: '#FFFF00',
        },
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.school.update).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        data: {
          logoUrl: 'https://example.com/new-logo.png',
          primaryColor: '#0000FF',
          secondaryColor: '#FFFF00',
        },
        select: {
          id: true,
          publicId: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
      expect(result.logoUrl).toBe('https://example.com/new-logo.png');
      expect(result.primaryColor).toBe('#0000FF');
      expect(result.secondaryColor).toBe('#FFFF00');
    });

    it('should throw NotFoundException when school does not exist', async () => {
      prismaService.school.findFirst.mockResolvedValue(null);

      await expect(
        service.updateBranding(
          'non-existent',
          'actor-1',
          { primaryColor: '#FF0000' },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another school', async () => {
      prismaService.school.findFirst.mockResolvedValue(baseSchool);

      await expect(
        service.updateBranding(
          'school-public-1',
          'actor-1',
          { primaryColor: '#FF0000' },
          { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-2' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to update any school branding', async () => {
      const updated = { ...baseSchool, primaryColor: '#0000FF' };
      prismaService.school.findFirst.mockResolvedValue(baseSchool);
      prismaService.school.update.mockResolvedValue(updated);

      const result = await service.updateBranding(
        'school-public-1',
        'actor-1',
        { primaryColor: '#0000FF' },
        { role: 'SUPER_ADMIN' as UserRole },
      );

      expect(result.primaryColor).toBe('#0000FF');
    });

    it('should create an audit log after updating branding', async () => {
      const updated = {
        ...baseSchool,
        logoUrl: 'https://example.com/new-logo.png',
      };
      prismaService.school.findFirst.mockResolvedValue(baseSchool);
      prismaService.school.update.mockResolvedValue(updated);

      const result = await service.updateBranding(
        'school-public-1',
        'actor-1',
        { logoUrl: 'https://example.com/new-logo.png' },
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(auditLogService.create).toHaveBeenCalledWith({
        action: 'UPDATE',
        resourceType: 'SchoolBranding',
        resourceId: 'school-1',
        oldValues: {
          logoUrl: 'https://example.com/logo.png',
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
        },
        newValues: {
          logoUrl: 'https://example.com/new-logo.png',
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
        },
        actorId: 'actor-1',
        schoolId: 'school-1',
      });
      expect(result.logoUrl).toBe('https://example.com/new-logo.png');
    });

    it('should handle partial updates (only some fields)', async () => {
      const updated = { ...baseSchool, primaryColor: '#0000FF' };
      prismaService.school.findFirst.mockResolvedValue(baseSchool);
      prismaService.school.update.mockResolvedValue(updated);

      const result = await service.updateBranding(
        'school-public-1',
        'actor-1',
        { primaryColor: '#0000FF' },
        { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' },
      );

      expect(prismaService.school.update).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        data: { primaryColor: '#0000FF' },
        select: {
          id: true,
          publicId: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
      expect(result.primaryColor).toBe('#0000FF');
      expect(result.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should return null branding fields when school has no branding set', async () => {
      const schoolWithoutBranding = {
        ...baseSchool,
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null,
      };
      prismaService.school.findFirst.mockResolvedValue(schoolWithoutBranding);

      const result = await service.getBranding('school-public-1', { role: 'SCHOOL_ADMIN' as UserRole, schoolId: 'school-1' });

      expect(result.logoUrl).toBeNull();
      expect(result.primaryColor).toBeNull();
      expect(result.secondaryColor).toBeNull();
    });
  });
});
