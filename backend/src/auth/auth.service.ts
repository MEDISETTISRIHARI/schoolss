import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@school-management/shared-types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string | null;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  availableRoles?: UserRole[];
  requiresRoleSelection: boolean;
}

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
  PRINCIPAL: ['PRINCIPAL', 'TEACHER', 'STUDENT'],
  SCHOOL_ADMIN: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
  TEACHER: ['TEACHER', 'STUDENT'],
  STUDENT: ['STUDENT'],
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return user;
  }

  getAvailableRoles(role: UserRole): UserRole[] {
    return ROLE_HIERARCHY[role] || [role];
  }

  async login(user: AuthenticatedUser, selectedRole?: UserRole): Promise<LoginResult> {
    const availableRoles = this.getAvailableRoles(user.role);
    const effectiveRole = selectedRole || user.role;

    if (selectedRole && !availableRoles.includes(selectedRole)) {
      throw new BadRequestException('Selected role is not available for this user');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: effectiveRole,
      schoolId: user.schoolId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: this.configService.get<string>('JWT_REFRESH_SECRET'), expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const requiresRoleSelection = availableRoles.length > 1;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: effectiveRole,
        schoolId: user.schoolId,
      },
      availableRoles: requiresRoleSelection ? availableRoles : undefined,
      requiresRoleSelection,
    };
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      schoolId: storedToken.user.schoolId,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(
      { sub: storedToken.user.id, type: 'refresh' },
      { secret: this.configService.get<string>('JWT_REFRESH_SECRET'), expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') },
    );

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return { message: 'If an account with that email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid password reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Password reset token has already been used');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    return { message: 'Password has been reset successfully' };
  }
}
