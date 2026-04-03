import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../types';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Neutral profile access denied.' });

    try {
      const result = await query('SELECT id, username, email, count_elo, avatar, created_at FROM users WHERE id = $1', [req.user.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'NOT_FOUND: Operator profile has been purged.' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve operator profile.' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Protocol update denied.' });
    const { avatar } = req.body;

    try {
      const result = await query(
        'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, username, avatar',
        [avatar, req.user.id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: 'UPDATE_FAILED: Profile synchronization error.' });
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const result = await query(
        'SELECT username, count_elo FROM users ORDER BY count_elo DESC LIMIT 10'
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve global rankings.' });
    }
  }
}
