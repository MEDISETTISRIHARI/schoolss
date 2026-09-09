/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Scope, Optional } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface AuditLogCreateInput {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  schoolId?: string;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditLogService {
  constructor(private prisma: PrismaService, @Optional() private request?: Request) {}

  async create(input: AuditLogCreateInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          oldValues: input.oldValues,
          newValues: input.newValues,
          schoolId: input.schoolId,
          actorId: input.actorId,
          ipAddress: input.ipAddress ?? (this.request as Request & { ip?: string })?.ip,
          userAgent: input.userAgent ?? (this.request as Request & { headers?: Record<string, unknown> })?.headers?.['user-agent'] as string | undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log', error);
    }
  }
}
