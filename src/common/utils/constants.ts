// API Configuration
export const API_VERSION = 'v1';
export const API_PREFIX = 'api';

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword'];

// Product
export const MIN_PRODUCT_PRICE = 0.01;
export const MAX_PRODUCT_PRICE = 99999.99;
export const MIN_STOCK = 0;
export const MAX_STOCK = 9999;

// Order
export const FREE_SHIPPING_THRESHOLD = 50; // EUR
export const STANDARD_SHIPPING_COST = 4.99; // EUR
export const VAT_RATE = 0.19; // 19%

// Cart
export const MAX_CART_ITEMS = 99;
export const MIN_CART_QUANTITY = 1;
export const MAX_CART_QUANTITY = 99;
export const CART_EXPIRY_DAYS = 30;

// Discount
export const MIN_DISCOUNT_PERCENTAGE = 0;
export const MAX_DISCOUNT_PERCENTAGE = 100;
export const MIN_DISCOUNT_AMOUNT = 0;
export const MAX_DISCOUNT_AMOUNT = 1000;

// Gift Card
export const MIN_GIFT_CARD_VALUE = 10; // EUR
export const MAX_GIFT_CARD_VALUE = 500; // EUR
export const GIFT_CARD_CODE_LENGTH = 16;

// Newsletter
export const NEWSLETTER_BATCH_SIZE = 100;
export const EMAIL_SENDING_DELAY = 1000; // ms between emails

// Ticket
export const TICKET_AUTO_CLOSE_DAYS = 30;
export const MAX_TICKET_ATTACHMENTS = 5;

// Rate Limiting
export const RATE_LIMIT_TTL = 60; // seconds
export const RATE_LIMIT_MAX = 100; // requests per TTL

// JWT
export const JWT_ACCESS_TOKEN_EXPIRY = '7d';
export const JWT_REFRESH_TOKEN_EXPIRY = '30d';

// Email Templates
export const EMAIL_FROM_NAME = 'Elbfunkeln';
export const EMAIL_FROM_ADDRESS = 'noreply@elbfunkeln.de';

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

// Regex Patterns
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const ZIP_CODE_REGEX = /^\d{5}$/;
export const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

// Supported Languages
export const SUPPORTED_LANGUAGES = ['de', 'en'];
export const DEFAULT_LANGUAGE = 'de';

// Currency
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCY_SYMBOL = '€';

// Social Media
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/elbfunkeln',
  FACEBOOK: 'https://facebook.com/elbfunkeln',
  PINTEREST: 'https://pinterest.com/elbfunkeln',
};

// Company Info
export const COMPANY_NAME = 'Elbfunkeln';
export const COMPANY_WEBSITE = 'https://elbfunkeln.de';
export const SUPPORT_EMAIL = 'support@elbfunkeln.de';

// Analytics
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_START: 'checkout_start',
  PURCHASE: 'purchase',
  SEARCH: 'search',
  NEWSLETTER_SUBSCRIBE: 'newsletter_subscribe',
} as const;
