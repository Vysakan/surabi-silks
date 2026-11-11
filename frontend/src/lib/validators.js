export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
  return /^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function isValidPincode(pincode) {
  return /^[1-9]\d{5}$/.test(pincode);
}

export function isRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  return value != null;
}

export function isMinLength(value, min) {
  return typeof value === 'string' && value.trim().length >= min;
}

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', '12345678', '123456789',
  '1234567890', '0987654321', '11111111', '12341234', '87654321', 'qwerty12', 'qwerty123', 'qwertyuiop',
  'iloveyou1', 'admin123', 'admin1234', 'administrator1', 'welcome1', 'welcome123', 'abc12345', 'abcd1234',
  'letmein1', 'changeme1', 'test1234', 'india123', 'surabhi123', 'surabi123', 'surabhisilks1', 'surabisilks1',
]);

export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number.';

/** Same rules as the API. Returns '' when the password is acceptable, otherwise the reason. */
export function passwordProblem(password, email = '') {
  const value = typeof password === 'string' ? password : '';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (value.length > 128) return 'Password must be 128 characters or fewer';
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) return 'Password must contain at least one letter and one number';
  const lower = value.toLowerCase();
  if (email && lower === email.trim().toLowerCase()) return 'Password must not be the same as your email address';
  if (COMMON_PASSWORDS.has(lower)) return 'This password is too common. Please choose a less predictable one';
  return '';
}

/** URL-safe slug that the API accepts: lowercase letters, numbers and single hyphens. */
export function toSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '');
}
