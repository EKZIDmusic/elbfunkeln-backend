import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/utils/response';

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const data = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Check if user exists
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check if user is banned
    if (user.banned) {
      return forbiddenResponse('Your account has been banned');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(data.password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password) and token
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    // Log error
    console.error('Login error:', error);

    // Return generic error
    return serverErrorResponse('Login failed');
  }
}