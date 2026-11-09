import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { addWishlistSchema } from '../schemas/wishlist.js';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getAll);
router.post('/', validate(addWishlistSchema), wishlistController.add);
router.delete('/:productId', wishlistController.remove);

export default router;
