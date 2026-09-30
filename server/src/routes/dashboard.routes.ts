import { Router } from 'express';
import { getDashboard, getNetMovement } from '../controllers/dashboard.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getDashboard);
router.get('/net-movement', getNetMovement);

export default router;
