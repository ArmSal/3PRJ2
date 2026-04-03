import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../types';

export class GameController {
  static async createGame(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Protocol access denied.' });
    const { channelId, gameType } = req.body;

    try {
      const result = await query(
        'INSERT INTO leaderboards (user_id, game_type, score) VALUES ($1, $2, $3) RETURNING id',
        [req.user.id, gameType || 'pong', 0]
      );
      // Note: Real-time game state is handled via Sockets.
      // This controller manages game metadata and leaderboard persistence.
      res.json({ id: result.rows[0]?.id });
    } catch (err: any) {
      res.status(400).json({ error: 'SESSION_FAILURE: Could not initialize game metadata.' });
    }
  }

  static async getActiveGames(req: Request, res: Response) {
    try {
      // In this modular architectural setup, active games are often tracked in-memory by the SocketHandler.
      // However, we provide a persistent view here for history/recovery.
      const result = await query(`
        SELECT l.*, u.username 
        FROM leaderboards l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.updated_at DESC
        LIMIT 20
      `);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve active signals.' });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    const { gameType } = req.params;
    try {
      const result = await query(
        'SELECT l.*, u.username, u.avatar FROM leaderboards l JOIN users u ON l.user_id = u.id WHERE l.game_type = $1 ORDER BY l.score DESC LIMIT 100',
        [gameType]
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve tactical rankings.' });
    }
  }
}
