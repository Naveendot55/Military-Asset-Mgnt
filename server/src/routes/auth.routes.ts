import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateUser, getMe);

export default router;
