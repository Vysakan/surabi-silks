import { orderService } from '../services/orderService.js';

export const orderController = {
  async getAll(req, res, next) {
    try { res.json(await orderService.getAll(req.validated, req.user)); } catch (error) { next(error); }
  },
  async getById(req, res, next) {
    try { res.json(await orderService.getById(req.params.id, req.user)); } catch (error) { next(error); }
  },
  async create(req, res, next) {
    try { res.status(201).json(await orderService.create(req.user.id, req.validated)); } catch (error) { next(error); }
  },
  async updateStatus(req, res, next) {
    try { res.json(await orderService.updateStatus(req.params.id, req.validated.status)); } catch (error) { next(error); }
  },
};
