import { wishlistService } from '../services/wishlistService.js';

export const wishlistController = {
  async getAll(req, res, next) {
    try {
      const items = await wishlistService.getAll(req.user.id);
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async add(req, res, next) {
    try {
      const { productId, variantId } = req.validated;
      const items = await wishlistService.add(req.user.id, productId, variantId);
      res.status(201).json(items);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const productId = parseInt(req.params.productId, 10);
      await wishlistService.remove(req.user.id, productId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
