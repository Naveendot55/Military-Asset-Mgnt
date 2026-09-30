import { Router } from 'express';
import { getPurchases, createPurchase } from '../controllers/purchase.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getPurchases);
router.post('/', requireRole(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']), createPurchase);

export default router;
