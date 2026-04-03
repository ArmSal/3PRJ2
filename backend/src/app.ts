import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import guildRoutes from './routes/guilds';
import gameRoutes from './routes/games';
import tournamentRoutes from './routes/tournaments';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Root route for API status
app.get('/', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    message: 'Gaming Plus Neural Network API v2.4.0',
    protocols: ['HTTP/JSON', 'WebSockets', 'WebRTC Signaling']
  });
});

export default app;
