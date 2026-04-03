import { Router } from 'express';
import { GuildController } from '../controllers/GuildController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, GuildController.createGuild as any);
router.get('/', authMiddleware, GuildController.getGuilds as any);
router.get('/:guildId/channels', authMiddleware, GuildController.getGuildChannels as any);
router.get('/channels/:channelId/messages', authMiddleware, GuildController.getChannelMessages as any);

export default router;
