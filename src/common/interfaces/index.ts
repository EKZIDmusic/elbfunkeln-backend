/**
 * User from JWT token
 */
export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Filter options
 */
export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

/**
 * Email options
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

/**
 * Address
 */
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  streetNumber: string;
  additional?: string;
  zipCode: string;
  city: string;
  country: string;
  phone?: string;
}

/**
 * Price calculation
 */
export interface PriceCalculation {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * API Error Response
 */
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: any[];
  timestamp: string;
  path: string;
}
