import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { calculateShippingSchema } from '@/utils/validation';
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/utils/response';

/**
 * POST /api/shipping/calculate
 * Calculate shipping costs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = calculateShippingSchema.parse(body);

    // Simple shipping calculation based on weight and destination
    let basePrice = 4.99;

    // Weight-based pricing (in grams)
    if (data.weight > 2000) {
      basePrice = 7.99;
    } else if (data.weight > 5000) {
      basePrice = 12.99;
    }

    // Zone-based pricing (simplified - normally would use postal code zones)
    const zipPrefix = data.zip.substring(0, 2);
    const isRemote = ['01', '02', '03', '17', '18', '19'].includes(zipPrefix);
    
    if (isRemote) {
      basePrice += 2.00;
    }

    // International shipping
    if (data.country !== 'DE') {
      basePrice = 14.99;
    }

    const options = [
      {
        method: 'standard',
        name: 'DHL Paket',
        price: Math.round(basePrice * 100) / 100,
        estimatedDays: data.country === 'DE' ? '2-3' : '5-7',
      },
      {
        method: 'express',
        name: 'DHL Express',
        price: Math.round((basePrice + 5.00) * 100) / 100,
        estimatedDays: data.country === 'DE' ? '1-2' : '2-3',
      },
      {
        method: 'gogreen',
        name: 'DHL GoGreen',
        price: Math.round((basePrice + 1.00) * 100) / 100,
        estimatedDays: data.country === 'DE' ? '2-3' : '5-7',
        co2Neutral: true,
      },
    ];

    return successResponse({
      weight: data.weight,
      destination: {
        zip: data.zip,
        country: data.country,
      },
      options,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Calculate shipping error:', error);
    return serverErrorResponse('Failed to calculate shipping');
  }
}