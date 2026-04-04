// backend/src/controllers/AdminController.ts
import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../types';

export class AdminController {
  /**
   * Middleware-style check: only the user with username 'admin' can proceed.
   * Applied as a guard before admin-only endpoints.
   */
  static async isAdmin(req: AuthRequest, res: Response, next: Function) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const result = await query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    if (result.rows[0]?.username !== 'admin') {
      return res.status(403).json({ error: 'ACCESS_DENIED: Administrator clearance required.' });
    }
    next();
  }

  /** Create a platform-wide notification */
  static async createNotification(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const { title, content, type } = req.body;

    try {
      const result = await query(
        'INSERT INTO notifications (title, content, type, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, type || 'info', req.user.id]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      res.status(400).json({ error: 'Failed to create notification.' });
    }
  }

  /** Get all notifications (public, sorted newest first) */
  static async getNotifications(req: Request, res: Response) {
    try {
      const result = await query(
        'SELECT n.*, u.username as author FROM notifications n LEFT JOIN users u ON n.created_by = u.id ORDER BY n.created_at DESC LIMIT 50'
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
  }

  /** Delete a notification */
  static async deleteNotification(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const { id } = req.params;
    try {
      await query('DELETE FROM notifications WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'Failed to delete notification.' });
    }
  }

  /** Admin dashboard stats */
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const users = await query('SELECT count(*) FROM users');
      const tournaments = await query('SELECT count(*) FROM tournaments');
      const notifs = await query('SELECT count(*) FROM notifications');
      res.json({
        totalUsers: parseInt(users.rows[0].count),
        totalTournaments: parseInt(tournaments.rows[0].count),
        totalNotifications: parseInt(notifs.rows[0].count)
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch admin stats.' });
    }
  }
}
