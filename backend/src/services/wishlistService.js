import { wishlistRepository } from '../repositories/wishlistRepository.js';
import { NotFoundError, AppError } from '../utils/AppError.js';
import { getPool } from '../config/database.js';

export const wishlistService = {
  async getAll(userId) {
    return wishlistRepository.findByUser(userId);
  },

  async add(userId, productId, variantId) {
    const [products] = await getPool().execute(
      'SELECT id, is_archived FROM products WHERE id = ?',
      [productId],
    );
    if (products.length === 0) throw new NotFoundError('Product');
    if (products[0].is_archived) throw new AppError(400, 'PRODUCT_UNAVAILABLE', 'Product is no longer available');

    if (variantId) {
      const [variants] = await getPool().execute(
        'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
        [variantId, productId],
      );
      if (variants.length === 0) throw new NotFoundError('Product variant');
    }

    await wishlistRepository.add(userId, productId, variantId);
    return wishlistRepository.findByUser(userId);
  },

  async remove(userId, productId) {
    await wishlistRepository.remove(userId, productId);
  },
};
