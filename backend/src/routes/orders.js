import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { createOrderSchema, orderQuerySchema, orderStatusSchema } from '../schemas/order.js';

const router = Router();
router.use(authenticate);
router.get('/', validateQuery(orderQuerySchema), orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', validate(createOrderSchema), orderController.create);
router.patch('/:id/status', requireRole('admin'), validate(orderStatusSchema), orderController.updateStatus);
export default router;
