// backend/src/routes/admin.ts
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { TournamentController } from '../controllers/TournamentController';
import authMiddleware from '../middleware/auth';

const router = Router();

// All admin routes require auth + admin check
router.use(authMiddleware);
router.use(AdminController.isAdmin as any);

// Admin dashboard stats
router.get('/stats', AdminController.getStats as any);

// Notifications CRUD
router.get('/notifications', AdminController.getNotifications as any);
router.post('/notifications', AdminController.createNotification as any);
router.delete('/notifications/:id', AdminController.deleteNotification as any);

// Tournament management (admin can create detailed tournaments)
router.post('/tournaments', TournamentController.createTournament as any);

export default router;
