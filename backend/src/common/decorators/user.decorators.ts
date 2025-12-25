import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    return data ? user?.[data] : user;
  },
);

export const UserTimezone = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Check user's timezone first
    if (request.user?.timezone) {
      return request.user.timezone;
    }
    
    // Fall back to header
    const headerTimezone = request.headers['x-timezone'];
    if (headerTimezone) {
      return headerTimezone;
    }
    
    // Default to UTC
    return 'UTC';
  },
);

export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  },
);
