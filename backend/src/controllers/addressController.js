import { addressService } from '../services/addressService.js';

export const addressController = {
  async getAll(req, res, next) {
    try {
      const addresses = await addressService.getAll(req.user.id, req.params.customerId);
      res.json(addresses);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const address = await addressService.create(req.user.id, req.params.customerId, req.validated);
      res.status(201).json(address);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const address = await addressService.update(req.user.id, req.params.customerId, parseInt(req.params.addressId, 10), req.validated);
      res.json(address);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await addressService.remove(req.user.id, req.params.customerId, parseInt(req.params.addressId, 10));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
