import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../types';

export class GuildController {
  static async createGuild(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Guild authorization required.' });
    const { name, description } = req.body;

    try {
      const result = await query(
        'INSERT INTO guilds (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, req.user.id]
      );
      const guild = result.rows[0];

      // Create a default #general channel for the new guild
      await query(
        'INSERT INTO channels (guild_id, name, type) VALUES ($1, $2, $3)',
        [guild.id, 'general', 'text']
      );

      res.status(201).json(guild);
    } catch (err: any) {
      res.status(400).json({ error: 'GUILD_CREATION_FAILED: Neural network already exists.' });
    }
  }

  static async getGuilds(req: AuthRequest, res: Response) {
    try {
      const result = await query('SELECT * FROM guilds ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve neural networks.' });
    }
  }

  static async getGuildChannels(req: Request, res: Response) {
    const { guildId } = req.params;
    try {
      const result = await query('SELECT * FROM channels WHERE guild_id = $1', [guildId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve tactical channels.' });
    }
  }

  static async getChannelMessages(req: Request, res: Response) {
    const { channelId } = req.params;
    try {
      const result = await query(
        'SELECT m.*, u.username FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = $1 ORDER BY m.created_at ASC LIMIT 100',
        [channelId]
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve message logs.' });
    }
  }
}
