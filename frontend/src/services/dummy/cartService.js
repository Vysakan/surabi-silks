const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export async function get() {
  await delay();
  return { items: [], totalItems: 0, subtotal: 0, shipping: 0, total: 0, freeShippingThreshold: 2000 };
}

export async function addItem() {
  await delay();
  return { items: [], totalItems: 0, subtotal: 0, shipping: 0, total: 0, freeShippingThreshold: 2000 };
}

export async function updateQuantity() {
  await delay();
  return { items: [], totalItems: 0, subtotal: 0, shipping: 0, total: 0, freeShippingThreshold: 2000 };
}

export async function removeItem() {
  await delay();
  return { items: [], totalItems: 0, subtotal: 0, shipping: 0, total: 0, freeShippingThreshold: 2000 };
}

export async function clear() {
  await delay();
  return true;
}
