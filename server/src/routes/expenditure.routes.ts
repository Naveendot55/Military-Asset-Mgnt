import { Router } from 'express';
import { getExpenditures, createExpenditure } from '../controllers/expenditure.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER']), getExpenditures);
router.post('/', requireRole(['ADMIN', 'BASE_COMMANDER']), createExpenditure);

export default router;
