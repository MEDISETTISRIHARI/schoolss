import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@school-management/shared-types';
import { PERMISSIONS_KEY, ROLES_KEY, PUBLIC_KEY } from '../decorators/roles.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if ((!requiredPermissions || requiredPermissions.length === 0) && (!requiredRoles || requiredRoles.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new BadRequestException('Insufficient role permissions');
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = await this.checkPermissions(user.role, requiredPermissions);
      if (!hasPermission) {
        throw new BadRequestException('Insufficient permissions');
      }
    }

    return true;
  }

  private async checkPermissions(role: string, permissions: string[]): Promise<boolean> {
    if (role === 'SUPER_ADMIN') {
      return true;
    }

    const rolePermissions = await this.prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: role as UserRole,
          },
        },
      },
      select: {
        name: true,
      },
    });

    const userPermissions = rolePermissions.map((p: { name: string }) => p.name);
    return permissions.every(p => userPermissions.includes('*') || userPermissions.includes(p));
  }
}
