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
    const { avatar, username } = req.body;

    try {
      // Build dynamic SET clause so either field can be updated independently
      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (username) { sets.push(`username = $${idx++}`); values.push(username); }
      if (avatar) { sets.push(`avatar = $${idx++}`); values.push(avatar); }

      if (sets.length === 0) return res.status(400).json({ error: 'NO_CHANGES: Nothing to update.' });

      values.push(req.user.id);
      const result = await query(
        `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, username, email, avatar`,
        values
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
