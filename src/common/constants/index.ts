/**
 * Tax rates for Germany
 */
export const TAX_RATES = {
  STANDARD: 0.19, // 19% MwSt
  REDUCED: 0.07, // 7% MwSt (reduced rate)
} as const;

/**
 * Currency
 */
export const CURRENCY = {
  CODE: 'EUR',
  SYMBOL: '€',
} as const;

/**
 * Order status transitions
 */
export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES_PER_PRODUCT: 10,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
} as const;

/**
 * Email templates
 */
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_SHIPPED: 'order-shipped',
  ORDER_DELIVERED: 'order-delivered',
  ORDER_CANCELLED: 'order-cancelled',
  NEWSLETTER: 'newsletter',
  GIFT_CARD: 'gift-card',
} as const;

/**
 * Regex patterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_DE: /^(\+49|0)[1-9]\d{1,14}$/,
  ZIP_CODE_DE: /^\d{5}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SKU: /^[A-Z0-9-]+$/,
} as const;

/**
 * German states (Bundesländer)
 */
export const GERMAN_STATES = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const;

/**
 * Shipping zones
 */
export const SHIPPING_ZONES = {
  GERMANY: 'DE',
  EU: 'EU',
  INTERNATIONAL: 'INTL',
} as const;

/**
 * Payment methods
 */
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'card',
  SEPA_DEBIT: 'sepa_debit',
  SOFORT: 'sofort',
  KLARNA: 'klarna',
  APPLE_PAY: 'apple_pay',
  GOOGLE_PAY: 'google_pay',
  GIFT_CARD: 'gift_card',
} as const;
