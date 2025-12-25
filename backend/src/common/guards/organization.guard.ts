import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { IS_PUBLIC_KEY } from '../decorators';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let JWT guard handle this
    }

    // Get organization ID from request params or body
    const organizationId =
      request.params.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    if (!organizationId) {
      return true; // No organization context required
    }

    // Super admins can access any organization
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user is a member of the organization
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organizationId,
        deletedAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    // Attach organization membership to request for later use
    request.organizationMembership = membership;

    return true;
  }
}
