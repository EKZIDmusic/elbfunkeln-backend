import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/version
 * Get API version and info
 */
export async function GET(req: NextRequest) {
  const version = {
    version: '1.0.0',
    name: 'Elbfunkeln E-Commerce API',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      authentication: true,
      products: true,
      cart: true,
      orders: true,
      payments: true,
      stripe: true,
      email: true,
      admin: true,
      analytics: true,
      tickets: true,
      giftCards: true,
      discounts: true,
      newsletter: true,
      reviews: true,
      favorites: true,
      addresses: true,
      shipping: true,
      returns: true,
    },
    endpoints: {
      total: 80,
      implemented: 80,
      percentage: 100,
    },
  };

  return NextResponse.json(version, { status: 200 });
}