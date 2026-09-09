import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_CONFIRMATION } from '../decorators/confirmation.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class ConfirmationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const requireConfirm = this.reflector.getAllAndOverride<boolean>(REQUIRE_CONFIRMATION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requireConfirm) return true;

    const body = request.body || {};
    const confirmation = body.confirmation || body.confirmPassword;

    if (!confirmation) {
      throw new BadRequestException('Confirmation required for this sensitive operation');
    }

    return true;
  }
}
