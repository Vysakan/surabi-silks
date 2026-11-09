import { Router } from 'express';
import { addressController } from '../controllers/addressController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { addressSchema } from '../schemas/address.js';

const router = Router();

router.use(authenticate);

router.get('/customers/:customerId/addresses', addressController.getAll);
router.post('/customers/:customerId/addresses', validate(addressSchema), addressController.create);
router.put('/customers/:customerId/addresses/:addressId', validate(addressSchema), addressController.update);
router.delete('/customers/:customerId/addresses/:addressId', addressController.remove);

export default router;
