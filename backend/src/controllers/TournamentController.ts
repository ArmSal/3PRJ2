import { Request, Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../types';

export class TournamentController {
  static async createTournament(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Tournament authority required.' });
    const { name, description, gameType, campus1, campus2, maxParticipants, startsAt } = req.body;

    try {
      const result = await query(
        'INSERT INTO tournaments (name, description, game_type, campus1, campus2, max_participants, created_by, starts_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [name, description, gameType, campus1, campus2, maxParticipants || 16, req.user.id, new Date(startsAt)]
      );
      res.json({ id: result.rows[0]?.id });
    } catch (err: any) {
      res.status(400).json({ error: 'TOURNAMENT_FAILURE: Could not initialize bracket protocol.' });
    }
  }

  static async getAllTournaments(req: Request, res: Response) {
    try {
      const result = await query(`
        SELECT t.*, u.username as creator_name, COUNT(tp.id) as participant_count
        FROM tournaments t 
        JOIN users u ON t.created_by = u.id
        LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
        GROUP BY t.id, u.username 
        ORDER BY t.created_at DESC
      `);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve global brackets.' });
    }
  }

  static async getTournamentById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const tResult = await query(`
        SELECT t.*, u.username as creator_name 
        FROM tournaments t
        JOIN users u ON t.created_by = u.id 
        WHERE t.id = $1
      `, [id]);
      
      if (tResult.rowCount === 0) return res.status(404).json({ error: 'NOT_FOUND: Tournament signature not found.' });

      const pResult = await query(`
        SELECT tp.*, u.username, u.avatar 
        FROM tournament_participants tp
        JOIN users u ON tp.user_id = u.id 
        WHERE tp.tournament_id = $1 
        ORDER BY tp.registered_at
      `, [id]);
      
      const mResult = await query(`
        SELECT tm.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
        FROM tournament_matches tm
        LEFT JOIN users u1 ON tm.player1_id = u1.id
        LEFT JOIN users u2 ON tm.player2_id = u2.id
        LEFT JOIN users w ON tm.winner_id = w.id
        WHERE tm.tournament_id = $1 
        ORDER BY tm.round, tm.match_number
      `, [id]);
      
      res.json({ ...tResult.rows[0], participants: pResult.rows, matches: mResult.rows });
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not retrieve tournament metadata.' });
    }
  }

  static async joinTournament(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Participant link required.' });
    const { id } = req.params;
    const { campus } = req.body;

    try {
      await query('INSERT INTO tournament_participants (tournament_id, user_id, campus) VALUES ($1, $2, $3)',
        [id, req.user.id, campus]);
      res.json({ success: true, message: 'PARTICIPANT_LINKED: Neural signature registered.' });
    } catch (err: any) {
      res.status(400).json({ error: 'JOIN_FAILED: Already registered or bracket full.' });
    }
  }

  static async startTournament(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED: Admin authority required.' });
    const { id } = req.params;

    try {
      const tResult = await query(
        'SELECT * FROM tournaments WHERE id = $1 AND created_by = $2', 
        [id, req.user.id]
      );
      
      if (tResult.rowCount === 0) return res.status(403).json({ error: 'ACCESS_DENIED: Unauthorized command.' });
      
      const pResult = await query('SELECT * FROM tournament_participants WHERE tournament_id = $1', [id]);
      const participants = pResult.rows;
      if (participants.length < 2) return res.status(400).json({ error: 'PROTOCOL_ERROR: Insufficient participants.' });

      const shuffled = participants.sort(() => Math.random() - 0.5);
      const rounds = Math.ceil(Math.log2(shuffled.length));
      
      for (let round = 1; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        for (let i = 0; i < matchesInRound; i++) {
          let player1 = null, player2 = null;
          if (round === 1) {
            player1 = shuffled[i * 2]?.user_id || null;
            player2 = shuffled[i * 2 + 1]?.user_id || null;
          }
          await query('INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id) VALUES ($1, $2, $3, $4, $5)',
            [id, round, i + 1, player1, player2]);
        }
      }
      
      await query('UPDATE tournaments SET status = $1 WHERE id = $2', ['ongoing', id]);
      res.json({ message: 'PROTOCOL_ACTIVE: Tournament brackets generated.' });
    } catch (err: any) {
      res.status(500).json({ error: 'SYSTEM_FAILURE: Could not initialize matches.' });
    }
  }
}
