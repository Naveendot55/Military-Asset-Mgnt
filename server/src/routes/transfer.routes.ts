import { Router } from 'express';
import { getTransfers, createTransfer } from '../controllers/transfer.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getTransfers);
router.post('/', requireRole(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']), createTransfer);

export default router;
