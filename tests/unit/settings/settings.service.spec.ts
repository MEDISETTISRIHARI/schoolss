import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../../../backend/src/settings/settings.service';
import { PrismaService } from '../../../backend/src/common/prisma/prisma.service';
import { AuditLogService } from '../../../backend/src/audit/audit.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: jest.Mocked<PrismaService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            platformSetting: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            schoolSetting: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
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

    service = module.get(SettingsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    auditLogService = module.get(AuditLogService) as jest.Mocked<AuditLogService>;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return platform settings for SUPER_ADMIN', async () => {
      prisma.platformSetting.findMany.mockResolvedValue([
        { key: 'platformKey', value: 'platformValue' },
      ] as any);

      const result = await service.getSettings({ role: 'SUPER_ADMIN' });

      expect(result).toEqual({ platform: { platformKey: 'platformValue' } });
    });

    it('should return school settings for non-SUPER_ADMIN', async () => {
      prisma.schoolSetting.findMany.mockResolvedValue([
        { key: 'schoolKey', value: 'schoolValue' },
      ] as any);

      const result = await service.getSettings({ role: 'SCHOOL_ADMIN', schoolId: 'school-1' });

      expect(result).toEqual({ school: { schoolKey: 'schoolValue' } });
    });

    it('should throw ForbiddenException if schoolId is missing for non-SUPER_ADMIN', async () => {
      await expect(service.getSettings({ role: 'SCHOOL_ADMIN' })).rejects.toThrow('School context required');
    });
  });
});
