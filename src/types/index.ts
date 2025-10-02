import { User, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Product Types
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

export interface ProductMetadata {
  material?: string;
  color?: string;
  size?: string;
  [key: string]: any;
}

// Cart Types
export interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string;
    stock: number;
  };
}

export interface CartSummary {
  items: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

// Order Types
export interface CreateOrderRequest {
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod: string;
  discountCode?: string;
  notes?: string;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: string;
      name: string;
      images: string;
    };
  }[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    zip: string;
    city: string;
    country: string;
  };
}

// Payment Types
export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

// Shipping Types
export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

export interface CalculateShippingRequest {
  weight: number;
  zip: string;
  country?: string;
}

// Newsletter Types
export interface NewsletterSubscribeRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

// Ticket Types
export interface CreateTicketRequest {
  subject: string;
  message: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface AddTicketMessageRequest {
  message: string;
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}