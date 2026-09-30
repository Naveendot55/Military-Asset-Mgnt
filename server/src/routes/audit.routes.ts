import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER']), getAuditLogs);

export default router;
