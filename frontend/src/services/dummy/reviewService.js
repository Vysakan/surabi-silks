import { reviews as initialReviews } from '@/data/reviews';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _reviews = [...initialReviews];

export async function getByProductId(productId) {
  await delay();
  return _reviews
    .filter((r) => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function create(reviewData) {
  await delay();
  const review = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  _reviews.push(review);
  return review;
}
