import { cartRepository } from '../repositories/cartRepository.js';
import { NotFoundError, AppError } from '../utils/AppError.js';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';

const FREE_SHIPPING_THRESHOLD = env.shipping.freeThreshold;
const SHIPPING_COST = env.shipping.cost;

export const cartService = {
  async get(userId) {
    const cartId = await cartRepository.findOrCreateCart(userId);
    const items = await cartRepository.getItems(cartId);
    return buildCartResponse(items);
  },

  async addItem(userId, productId, variantId, quantity) {
    const variant = await validateVariant(productId, variantId);
    const cartId = await cartRepository.findOrCreateCart(userId);

    const existing = await cartRepository.findItem(cartId, variantId);
    const newQty = (existing ? existing.quantity : 0) + quantity;

    if (newQty > variant.stock) {
      throw new AppError(400, 'INSUFFICIENT_STOCK', `Only ${variant.stock} available`);
    }

    if (existing) {
      await cartRepository.setItemQuantity(cartId, variantId, newQty);
    } else {
      await cartRepository.upsertItem(cartId, productId, variantId, quantity);
    }

    const items = await cartRepository.getItems(cartId);
    return buildCartResponse(items);
  },

  async updateQuantity(userId, variantId, quantity) {
    const cartId = await cartRepository.findOrCreateCart(userId);
    const existing = await cartRepository.findItem(cartId, variantId);
    if (!existing) throw new NotFoundError('Cart item');

    const [variants] = await getPool().execute(
      'SELECT stock FROM product_variants WHERE id = ?',
      [variantId],
    );
    if (variants.length === 0) throw new NotFoundError('Product variant');
    if (quantity > variants[0].stock) {
      throw new AppError(400, 'INSUFFICIENT_STOCK', `Only ${variants[0].stock} available`);
    }

    await cartRepository.setItemQuantity(cartId, variantId, quantity);
    const items = await cartRepository.getItems(cartId);
    return buildCartResponse(items);
  },

  async removeItem(userId, variantId) {
    const cartId = await cartRepository.findOrCreateCart(userId);
    await cartRepository.removeItem(cartId, variantId);
    const items = await cartRepository.getItems(cartId);
    return buildCartResponse(items);
  },

  async clear(userId) {
    const cartId = await cartRepository.findOrCreateCart(userId);
    await cartRepository.clearCart(cartId);
  },
};

async function validateVariant(productId, variantId) {
  const [products] = await getPool().execute(
    'SELECT id, is_archived FROM products WHERE id = ?',
    [productId],
  );
  if (products.length === 0) throw new NotFoundError('Product');
  if (products[0].is_archived) throw new AppError(400, 'PRODUCT_UNAVAILABLE', 'Product is no longer available');

  const [variants] = await getPool().execute(
    'SELECT id, stock, price FROM product_variants WHERE id = ? AND product_id = ?',
    [variantId, productId],
  );
  if (variants.length === 0) throw new NotFoundError('Product variant');
  return variants[0];
}

function buildCartResponse(items) {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  return {
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
}
