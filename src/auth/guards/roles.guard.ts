import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express'; // import Request type from express
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>(); // specify Request type
    const user = request.user as { role: string[] }; //  assert expected shape of user

    return matchRoles(requiredRoles, user?.role);
  }
}

function matchRoles(requiredRoles: string[], userRole: string[]) {
  return requiredRoles.some((role: string) => userRole?.includes(role));
}
