import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

/**
 * Get Client IP Address
 */
export const GetIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip
    );
  },
);

/**
 * Get User Agent
 */
export const GetUserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
);

/**
 * Skip Throttle/Rate Limiting
 */
export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);

/**
 * API Response Metadata
 */
export const RESPONSE_MESSAGE_KEY = 'responseMessage';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Swagger API Group
 */
export const API_GROUP_KEY = 'apiGroup';
export const ApiGroup = (group: string) => SetMetadata(API_GROUP_KEY, group);