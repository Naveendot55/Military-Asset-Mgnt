import { Router } from 'express';
import { getEquipment, createEquipment } from '../controllers/equipment.controller';
import { authenticateUser, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateUser);
router.get('/', getEquipment);
router.post('/', requireRole(['ADMIN']), createEquipment);

export default router;
