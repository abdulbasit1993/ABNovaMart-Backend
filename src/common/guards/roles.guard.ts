import {
  Injectable,
  ExecutionContext,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No @Roles() decorator, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JwtAuthGuard

    if (!requiredRoles.some((role) => user?.role === role)) {
      throw new ForbiddenException('Access Denied');
    }

    return true;
  }
}

/**
 *
 * Example Usage (Admin-only routes):
 *
 * @Get('admin/users')
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * async getAllUsers() {
 * // your controller logic
 * }
 *
 */
