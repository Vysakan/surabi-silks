import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../schemas/product.js';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.getAll);
router.get('/featured', productController.getFeatured);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/bestsellers', productController.getBestsellers);
router.get('/search', productController.search);
router.get('/slug/:slug', productController.getBySlug);
router.get('/:id', productController.getById);
router.get('/:id/related', productController.getRelated);

router.post('/', authenticate, requireRole('admin'), validate(createProductSchema), productController.create);
router.put('/:id', authenticate, requireRole('admin'), validate(updateProductSchema), productController.update);
router.delete('/:id', authenticate, requireRole('admin'), productController.remove);

router.post('/:id/images', authenticate, requireRole('admin'), uploadSingle, productController.uploadImage);
router.delete('/:id/images/:imageId', authenticate, requireRole('admin'), productController.removeImage);

export default router;
