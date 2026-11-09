import { reviewService } from '../services/reviewService.js';

export const reviewController = {
  async getByProductId(req, res, next) {
    try { res.json(await reviewService.getByProductId(Number(req.params.id))); } catch (error) { next(error); }
  },
  async create(req, res, next) {
    try { res.status(201).json(await reviewService.create(req.user.id, req.validated)); } catch (error) { next(error); }
  },
};
