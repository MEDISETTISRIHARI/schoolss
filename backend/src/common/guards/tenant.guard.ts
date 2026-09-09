import { Injectable, CanActivate, ExecutionContext, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { SCHOOL_ID_KEY, PUBLIC_KEY } from '../decorators/roles.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requireSchool = this.reflector.getAllAndOverride<boolean>(SCHOOL_ID_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireSchool) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const schoolId = user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('School context required');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, isActive: true },
    });

    if (!school || !school.isActive) {
      throw new BadRequestException('Invalid or inactive school');
    }

    request.school = school;
    return true;
  }
}
