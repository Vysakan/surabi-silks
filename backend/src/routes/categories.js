import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.js';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/tree', categoryController.getTree);
router.get('/slug/:slug', categoryController.getBySlug);

router.post('/', authenticate, requireRole('admin'), validate(createCategorySchema), categoryController.create);
router.put('/:id', authenticate, requireRole('admin'), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', authenticate, requireRole('admin'), categoryController.remove);

export default router;
