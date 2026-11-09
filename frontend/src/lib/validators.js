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
