import { Router } from 'express';
import { TournamentController } from '../controllers/TournamentController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, TournamentController.createTournament as any);
router.get('/', authMiddleware, TournamentController.getAllTournaments as any);
router.get('/:id', authMiddleware, TournamentController.getTournamentById as any);
router.post('/:id/join', authMiddleware, TournamentController.joinTournament as any);
router.post('/:id/start', authMiddleware, TournamentController.startTournament as any);

export default router;
