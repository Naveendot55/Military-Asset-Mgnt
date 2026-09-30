import { Router } from 'express';
import { getAssignments, createAssignment } from '../controllers/assignment.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', requireRole(['ADMIN', 'BASE_COMMANDER']), getAssignments);
router.post('/', requireRole(['ADMIN', 'BASE_COMMANDER']), createAssignment);

export default router;
