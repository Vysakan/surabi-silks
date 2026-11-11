import { customers as initialCustomers } from '@/data/customers';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _customers = JSON.parse(JSON.stringify(initialCustomers));

export async function login(email, password) {
  await delay();
  const customer = _customers.find(
    (c) => c.email === email && c.password === password
  );
  if (!customer) throw new Error('Invalid email or password');
  const { password: _, ...user } = customer;
  return user;
}

export async function register(data) {
  await delay();
  if (_customers.some((c) => c.email === data.email)) {
    throw new Error('Email already registered');
  }
  const id = `cust-${Date.now()}`;
  const newCustomer = {
    ...data,
    id,
    role: 'customer',
    avatar: null,
    addresses: [],
    createdAt: new Date().toISOString().split('T')[0],
  };
  _customers.push(newCustomer);
  const { password: _, ...user } = newCustomer;
  return user;
}

export async function logout() {
  await delay(100);
  return true;
}

export async function getCurrentUser(userId) {
  await delay();
  const customer = _customers.find((c) => c.id === userId);
  if (!customer) return null;
  const { password: _, ...user } = customer;
  return user;
}

export async function forgotPassword() {
  await delay();
  return { message: 'Demo mode: no email is sent. Connect the API (VITE_DATA_PROVIDER=api) to use password reset.' };
}

export async function verifyResetToken() {
  await delay();
  throw new Error('Password reset links need the real backend (VITE_DATA_PROVIDER=api).');
}

export async function resetPassword() {
  await delay();
  throw new Error('Password reset links need the real backend (VITE_DATA_PROVIDER=api).');
}

export async function changePassword() {
  await delay();
  return { message: 'Password updated (demo mode).' };
}
