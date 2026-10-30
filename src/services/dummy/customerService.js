import { customers as initialCustomers } from '@/data/customers';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _customers = JSON.parse(JSON.stringify(initialCustomers));

function sanitize(customer) {
  if (!customer) return null;
  const { password, ...safe } = customer;
  return safe;
}

export async function getById(id) {
  await delay();
  return sanitize(_customers.find((c) => c.id === id));
}

export async function update(id, data) {
  await delay();
  const index = _customers.findIndex((c) => c.id === id);
  if (index === -1) return null;
  _customers[index] = { ..._customers[index], ...data };
  return sanitize(_customers[index]);
}

export async function getAddresses(customerId) {
  await delay();
  const customer = _customers.find((c) => c.id === customerId);
  return customer?.addresses || [];
}

export async function addAddress(customerId, address) {
  await delay();
  const customer = _customers.find((c) => c.id === customerId);
  if (!customer) return null;
  const newAddr = { ...address, id: `addr-${Date.now()}` };
  if (customer.addresses.length === 0) newAddr.isDefault = true;
  customer.addresses.push(newAddr);
  return newAddr;
}

export async function updateAddress(customerId, addressId, data) {
  await delay();
  const customer = _customers.find((c) => c.id === customerId);
  if (!customer) return null;
  const index = customer.addresses.findIndex((a) => a.id === addressId);
  if (index === -1) return null;
  customer.addresses[index] = { ...customer.addresses[index], ...data };
  return customer.addresses[index];
}

export async function removeAddress(customerId, addressId) {
  await delay();
  const customer = _customers.find((c) => c.id === customerId);
  if (!customer) return false;
  customer.addresses = customer.addresses.filter((a) => a.id !== addressId);
  return true;
}
