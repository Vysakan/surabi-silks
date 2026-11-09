import { cartService } from '../services/cartService.js';

export const cartController = {
  async get(req, res, next) {
    try {
      const cart = await cartService.get(req.user.id);
      res.json(cart);
    } catch (err) {
      next(err);
    }
  },

  async addItem(req, res, next) {
    try {
      const { productId, variantId, quantity } = req.validated;
      const cart = await cartService.addItem(req.user.id, productId, variantId, quantity);
      res.status(201).json(cart);
    } catch (err) {
      next(err);
    }
  },

  async updateQuantity(req, res, next) {
    try {
      const variantId = parseInt(req.params.variantId, 10);
      const { quantity } = req.validated;
      const cart = await cartService.updateQuantity(req.user.id, variantId, quantity);
      res.json(cart);
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req, res, next) {
    try {
      const variantId = parseInt(req.params.variantId, 10);
      const cart = await cartService.removeItem(req.user.id, variantId);
      res.json(cart);
    } catch (err) {
      next(err);
    }
  },

  async clear(req, res, next) {
    try {
      await cartService.clear(req.user.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
