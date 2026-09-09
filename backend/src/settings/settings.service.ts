/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserRole } from '@prisma/client';

type SettingsMap = Record<string, unknown>;

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async getSettings(requester: { role: UserRole; schoolId?: string }) {
    if (requester.role === 'SUPER_ADMIN') {
      const platformSettings = await this.prisma.platformSetting.findMany();
      const result: SettingsMap = {};
      for (const setting of platformSettings) {
        result[setting.key] = setting.value;
      }
      return { platform: result };
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const schoolSettings = await this.prisma.schoolSetting.findMany({
      where: { schoolId: requester.schoolId },
    });

    const result: SettingsMap = {};
    for (const setting of schoolSettings) {
      result[setting.key] = setting.value;
    }
    return { school: result };
  }

  async updateSettings(actorId: string, updateSettingsDto: UpdateSettingsDto, requester: { role: UserRole; schoolId?: string }) {
    const { settings } = updateSettingsDto;

    if (requester.role === 'SUPER_ADMIN') {
      const existing = await this.prisma.platformSetting.findMany();
      const existingMap = new Map<string, (typeof existing)[number]>(existing.map((s) => [s.key, s]));

      const updated: SettingsMap = {};
      for (const key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
          const value = settings[key];
          const existingSetting = existingMap.get(key);
          if (existingSetting) {
            const updatedSetting = await this.prisma.platformSetting.update({
              where: { id: existingSetting.id },
              data: { value: value as any },
            });
            updated[key] = updatedSetting.value;
          } else {
            const newSetting = await this.prisma.platformSetting.create({
              data: { key, value: value as any },
            });
            updated[key] = newSetting.value;
          }
        }
      }

      await this.auditLogService.create({
        action: 'UPDATE',
        resourceType: 'PlatformSettings',
        newValues: updated,
        actorId,
        schoolId: undefined,
      });

      return { platform: updated };
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const existing = await this.prisma.schoolSetting.findMany({
      where: { schoolId: requester.schoolId },
    });

    const existingMap = new Map<string, (typeof existing)[number]>(existing.map((s) => [s.key, s]));

    const updated: SettingsMap = {};
    for (const key in settings) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        const value = settings[key];
        const existingSetting = existingMap.get(key);
        if (existingSetting) {
          const updatedSetting = await this.prisma.schoolSetting.update({
            where: { id: existingSetting.id },
            data: { value: value as any },
          });
          updated[key] = updatedSetting.value;
        } else {
          const newSetting = await this.prisma.schoolSetting.create({
            data: { schoolId: requester.schoolId, key, value: value as any },
          });
          updated[key] = newSetting.value;
        }
      }
    }

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'SchoolSettings',
      newValues: updated,
      actorId,
      schoolId: requester.schoolId,
    });

    return { school: updated };
  }
}
