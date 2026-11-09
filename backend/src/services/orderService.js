import { orderRepository } from '../repositories/orderRepository.js';
import { NotFoundError, AppError } from '../utils/AppError.js';

const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const orderService = {
  getAll(params, user) {
    return orderRepository.list({ ...params, userId: user.role === 'admin' ? null : user.id });
  },
  async getById(id, user) {
    const order = await orderRepository.findById(id, user.role === 'admin' ? null : user.id);
    if (!order) throw new NotFoundError('Order');
    return order;
  },
  create(userId, data) {
    return orderRepository.create(userId, data);
  },
  async updateStatus(id, status) {
    const current = await orderRepository.findById(id);
    if (!current) throw new NotFoundError('Order');
    if (!NEXT_STATUS[current.status].includes(status)) {
      throw new AppError(400, 'INVALID_STATUS_TRANSITION', `Cannot change order status from ${current.status} to ${status}`);
    }
    return orderRepository.updateStatus(id, status);
  },
};
