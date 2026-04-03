import { Router } from 'express';
import { GameController } from '../controllers/GameController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, GameController.createGame as any);
router.get('/active', GameController.getActiveGames);
router.get('/leaderboard/:gameType', GameController.getLeaderboard);

export default router;
