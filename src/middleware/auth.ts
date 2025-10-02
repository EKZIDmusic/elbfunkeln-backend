import { NextRequest } from 'next/server';
import { getUserFromToken, extractTokenFromHeader } from '@/lib/auth';
import { unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '@/utils/response';
import { UserRole } from '@prisma/client';

/**
 * Middleware to require authentication
 * Extracts user from JWT token and adds it to the request
 */
export function requireAuth(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options?: {
    requiredRole?: UserRole | UserRole[];
  }
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return unauthorizedResponse('No token provided');
      }

      // Get user from token
      const user = await getUserFromToken(token);

      // Check role requirement
      if (options?.requiredRole) {
        const requiredRoles = Array.isArray(options.requiredRole)
          ? options.requiredRole
          : [options.requiredRole];

        // Admin has access to everything
        if (user.role !== 'ADMIN' && !requiredRoles.includes(user.role as UserRole)) {
          return forbiddenResponse('Insufficient permissions');
        }
      }

      // Add user to request
      (req as any).user = user;

      // Call the actual handler
      return handler(req, context);
    } catch (error: any) {
      console.error('Auth middleware error:', error);

      if (error.message === 'Invalid or expired token') {
        return unauthorizedResponse('Invalid or expired token');
      }

      if (error.message === 'User not found') {
        return unauthorizedResponse('User not found');
      }

      if (error.message === 'User account is banned') {
        return forbiddenResponse('Your account has been banned');
      }

      return serverErrorResponse('Authentication failed');
    }
  };
}

/**
 * Middleware for admin-only routes
 */
export function requireAdmin(handler: (req: NextRequest, context?: any) => Promise<Response>) {
  return requireAuth(handler, { requiredRole: UserRole.ADMIN });
}

/**
 * Middleware for shop owner and admin routes
 */
export function requireShopOwner(handler: (req: NextRequest, context?: any) => Promise<Response>) {
  return requireAuth(handler, { requiredRole: [UserRole.SHOP_OWNER, UserRole.ADMIN] });
}

/**
 * Optional auth - doesn't fail if no token, but adds user if available
 */
export function optionalAuth(handler: (req: NextRequest, context?: any) => Promise<Response>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        const user = await getUserFromToken(token);
        (req as any).user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error);
    }

    return handler(req, context);
  };
}