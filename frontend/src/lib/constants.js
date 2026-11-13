export const FALLBACK_IMAGE = '/images/products/fabrics-stack.png';

// Your Instagram page, shown as "Follow us" next to the reels on the home page. Leave '' to hide.
export const INSTAGRAM_URL = '';

export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const LOCALE = 'en-IN';
export const ITEMS_PER_PAGE = 12;
export const ITEMS_PER_PAGE_ADMIN = 20;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function getValidNextStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

export function isValidTransition(from, to) {
  return getValidNextStatuses(from).includes(to);
}

export const SELLING_UNITS = {
  PIECE: 'piece',
  METRE: 'metre',
};

export const FREE_SHIPPING_THRESHOLD = 2000;
export const SHIPPING_COST = 99;
