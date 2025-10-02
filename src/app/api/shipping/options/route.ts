import { NextRequest } from 'next/server';
import { successResponse } from '@/utils/response';

/**
 * GET /api/shipping/options
 * Get available shipping options
 */
export async function GET(req: NextRequest) {
  const shippingOptions = [
    {
      id: 'dhl-standard',
      name: 'DHL Paket',
      description: 'Standard-Versand',
      price: 4.99,
      estimatedDays: 2-3,
      carrier: 'DHL',
    },
    {
      id: 'dhl-express',
      name: 'DHL Express',
      description: 'Express-Versand',
      price: 9.99,
      estimatedDays: 1-2,
      carrier: 'DHL',
    },
    {
      id: 'dhl-gogreen',
      name: 'DHL GoGreen',
      description: 'Klimaneutraler Versand',
      price: 5.99,
      estimatedDays: 2-3,
      carrier: 'DHL',
      co2Neutral: true,
    },
    {
      id: 'free-shipping',
      name: 'Kostenloser Versand',
      description: 'Kostenlos ab 50€',
      price: 0,
      estimatedDays: 3-5,
      minOrderValue: 50,
    },
  ];

  return successResponse(shippingOptions);
}