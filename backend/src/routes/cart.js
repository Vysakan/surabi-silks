import { Router } from 'express';
import { cartController } from '../controllers/cartController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { addCartItemSchema, updateCartQuantitySchema } from '../schemas/cart.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.get);
router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch('/items/:variantId', validate(updateCartQuantitySchema), cartController.updateQuantity);
router.delete('/items/:variantId', cartController.removeItem);
router.delete('/', cartController.clear);

export default router;
