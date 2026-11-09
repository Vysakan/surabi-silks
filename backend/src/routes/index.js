import { Router } from 'express';
import authRoutes from './auth.js';
import productRoutes from './products.js';
import categoryRoutes from './categories.js';
import wishlistRoutes from './wishlist.js';
import cartRoutes from './cart.js';
import addressRoutes from './addresses.js';
import orderRoutes from './orders.js';
import { reviewController } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema } from '../schemas/review.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.post('/reviews', authenticate, validate(createReviewSchema), reviewController.create);
router.use('/', addressRoutes);

export default router;
