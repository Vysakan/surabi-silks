import { orders as initialOrders } from '@/data/orders';
import { isValidTransition } from '@/lib/constants';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _orders = JSON.parse(JSON.stringify(initialOrders));
let _counter = _orders.length;

export async function getAll({ page = 1, limit = 20, status } = {}) {
  await delay();
  let result = [..._orders];
  if (status) result = result.filter((o) => o.status === status);
  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = result.slice(start, start + limit);

  return { items, total, totalPages, page };
}

export async function getById(id) {
  await delay();
  return _orders.find((o) => o.id === id) || null;
}

export async function getByCustomerId(customerId) {
  await delay();
  return _orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function create(orderData) {
  await delay();
  _counter++;
  const id = `ORD-2026-${String(_counter).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const order = {
    ...orderData,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    statusHistory: [{ status: 'pending', timestamp: now }],
  };
  _orders.push(order);
  return order;
}

export async function updateStatus(id, status) {
  await delay();
  const order = _orders.find((o) => o.id === id);
  if (!order) return null;
  if (!isValidTransition(order.status, status)) {
    throw new Error(`Invalid transition from "${order.status}" to "${status}"`);
  }
  const now = new Date().toISOString();
  order.status = status;
  order.updatedAt = now;
  order.statusHistory.push({ status, timestamp: now });
  return order;
}
