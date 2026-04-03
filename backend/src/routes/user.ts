import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/profile', authMiddleware, UserController.getProfile as any);
router.put('/profile', authMiddleware, UserController.updateProfile as any);
router.get('/leaderboard', UserController.getLeaderboard);

export default router;
