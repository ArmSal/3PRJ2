import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import guildRoutes from './routes/guilds';
import gameRoutes from './routes/games';
import tournamentRoutes from './routes/tournaments';
import adminRoutes from './routes/admin';
import { AdminController } from './controllers/AdminController';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increased limit for avatar base64 uploads

// API Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/admin', adminRoutes);

// Public endpoint — no auth needed so Landing page can fetch notifications
app.get('/api/notifications', AdminController.getNotifications as any);

// Root route for API status
app.get('/', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    message: 'Gaming Plus Neural Network API v2.4.0',
    protocols: ['HTTP/JSON', 'WebSockets', 'WebRTC Signaling']
  });
});

export default app;
