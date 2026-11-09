import { reviewRepository } from '../repositories/reviewRepository.js';

export const reviewService = {
  getByProductId(productId) { return reviewRepository.findByProductId(productId); },
  create(userId, data) { return reviewRepository.create(userId, data); },
};
