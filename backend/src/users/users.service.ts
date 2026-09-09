/* eslint-disable @typescript-eslint/no-explicit-any */
import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UserRole, UserStatus } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  role: UserRole;
  status: UserStatus;
  schoolId?: string;
  createdAt: Date;
  updatedAt: Date;
  school?: { id: string; name: string } | null;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async create(actorId: string, createUserDto: CreateUserDto, requester: { role: UserRole; schoolId?: string }): Promise<SafeUser> {
    const { password, role, schoolId, status, ...rest } = createUserDto;

    const normalizedRole = role.toUpperCase() as UserRole;

    if (requester.role !== 'SUPER_ADMIN') {
      if (!requester.schoolId) {
        throw new ForbiddenException('School context required');
      }

      if (schoolId && schoolId !== requester.schoolId) {
        throw new ForbiddenException('Cannot assign user to another school');
      }

      if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'PRINCIPAL') {
        throw new ForbiddenException('Insufficient permissions to assign this role');
      }
    }

    const targetSchoolId = requester.role === 'SUPER_ADMIN' ? schoolId : requester.schoolId;

    if (!targetSchoolId) {
      throw new BadRequestException('School assignment is required');
    }

    const school = await this.prisma.school.findFirst({
      where: { id: targetSchoolId, deletedAt: null },
    });

    if (!school) {
      throw new BadRequestException('Invalid school');
    }

    const existing = await this.prisma.user.findFirst({
      where: { email: rest.email.toLowerCase(), deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email: rest.email.toLowerCase(),
        passwordHash,
        role: normalizedRole,
        schoolId: targetSchoolId,
        status: status ?? 'ACTIVE',
      },
      include: { school: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user as any;

    await this.auditLogService.create({
      action: 'CREATE',
      resourceType: 'User',
      resourceId: user.id,
      newValues: safeUser,
      actorId,
      schoolId: targetSchoolId,
    });

    return safeUser;
  }

  async findAll(requester: { role: UserRole; schoolId?: string }): Promise<SafeUser[]> {
    if (requester.role === 'SUPER_ADMIN') {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        include: { school: true },
        orderBy: { createdAt: 'desc' },
      });
      return users.map((u) => this.stripPasswordHash(u));
    }

    if (!requester.schoolId) {
      throw new ForbiddenException('School context required');
    }

    const users = await this.prisma.user.findMany({
      where: { schoolId: requester.schoolId, deletedAt: null },
      include: { school: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.stripPasswordHash(u));
  }

  private async resolvePublicId(publicId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { publicId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.id;
  }

  async findOne(publicId: string, requester: { role: UserRole; schoolId?: string }): Promise<SafeUser> {
    const id = await this.resolvePublicId(publicId);
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { school: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this user');
    }

    return this.stripPasswordHash(user);
  }

  async getMe(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { school: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.stripPasswordHash(user);
  }

  async update(publicId: string, actorId: string, updateUserDto: UpdateUserDto, requester: { role: UserRole; schoolId?: string }): Promise<SafeUser> {
    const id = await this.resolvePublicId(publicId);
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this user');
    }

    const oldSafe = this.stripPasswordHash(user);

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: { school: true },
    });

    const newSafe = this.stripPasswordHash(updated);

    await this.auditLogService.create({
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: updated.id,
      oldValues: oldSafe,
      newValues: newSafe,
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return newSafe;
  }

  async changeRole(publicId: string, actorId: string, changeRoleDto: ChangeRoleDto, requester: { role: UserRole; schoolId?: string }): Promise<SafeUser> {
    if (requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only platform administrators can change user roles');
    }

    const id = await this.resolvePublicId(publicId);
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newRole = changeRoleDto.role.toUpperCase() as UserRole;

    if (user.role === newRole) {
      throw new BadRequestException('User already has this role');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      include: { school: true },
    });

    const safeUser = this.stripPasswordHash(updated);

    await this.auditLogService.create({
      action: 'ROLE_CHANGE',
      resourceType: 'User',
      resourceId: updated.id,
      oldValues: { role: user.role },
      newValues: { role: newRole },
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return safeUser;
  }

  async changeStatus(publicId: string, actorId: string, changeStatusDto: ChangeStatusDto, requester: { role: UserRole; schoolId?: string }): Promise<SafeUser> {
    const id = await this.resolvePublicId(publicId);
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (requester.role !== 'SUPER_ADMIN' && user.schoolId !== requester.schoolId) {
      throw new ForbiddenException('Access denied to this user');
    }

    const newStatus = changeStatusDto.status.toUpperCase() as UserStatus;

    if (user.status === newStatus) {
      throw new BadRequestException('User already has this status');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: newStatus },
      include: { school: true },
    });

    const safeUser = this.stripPasswordHash(updated);

    await this.auditLogService.create({
      action: 'STATUS_CHANGE',
      resourceType: 'User',
      resourceId: updated.id,
      oldValues: { status: user.status },
      newValues: { status: newStatus },
      actorId,
      schoolId: user.schoolId ?? undefined,
    });

    return safeUser;
  }

  private stripPasswordHash(user: unknown): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...rest } = user as any;
    return rest as SafeUser;
  }
}
