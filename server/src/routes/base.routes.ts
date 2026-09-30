import { Router } from 'express';
import { getBases, createBase } from '../controllers/base.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getBases);
router.post('/', requireRole(['ADMIN']), createBase);

export default router;
