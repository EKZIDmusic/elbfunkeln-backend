import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// User Profile Schemas
export const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
});

// Address Schemas
export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street: z.string().min(1, 'Street is required'),
  zip: z.string().regex(/^\d{5}$/, 'Invalid German ZIP code'),
  city: z.string().min(1, 'City is required'),
  country: z.string().default('DE'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Product Schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().uuid('Invalid category ID'),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  weight: z.number().int().positive().optional(),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  metadata: z.record(z.string(), z.any()).optional(), // ✅ Korrigiert: Key- und Value-Typ
});

export const updateProductSchema = createProductSchema.partial();

// Cart Schemas
export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

// Order Schemas
export const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid('Invalid shipping address ID'),
  billingAddressId: z.string().uuid('Invalid billing address ID'),
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

// Payment Schemas
export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('eur'),
  metadata: z.record(z.string(), z.string()).optional(), // ✅ Korrigiert: Key- und Value-Typ
});

// Gift Card Schemas
export const purchaseGiftCardSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  recipientEmail: z.string().email('Invalid recipient email').optional(),
  recipientName: z.string().optional(),
  message: z.string().max(500, 'Message too long').optional(),
});

export const validateGiftCardSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

// Discount Schemas
export const createDiscountSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive('Value must be positive'),
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

export const applyDiscountSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
});

// Ticket Schemas
export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

export const addTicketMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// Newsletter Schemas
export const subscribeNewsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Review Schemas
export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100, 'Title too long').optional(),
  comment: z.string().max(1000, 'Comment too long').optional(),
});

// Shipping Schemas
export const calculateShippingSchema = z.object({
  weight: z.number().int().positive('Weight must be positive'),
  zip: z.string().regex(/^\d{5}$/, 'Invalid German ZIP code'),
  country: z.string().default('DE'),
});

// Pagination Schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  ...paginationSchema.shape,
});