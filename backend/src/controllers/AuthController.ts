import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

export class AuthController {
  static async register(req: Request, res: Response) {
    const { username, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'hackathon-jury-key-2024',
        { expiresIn: '24h' }
      );

      res.status(201).json({ user, token });
    } catch (err: any) {
      res.status(400).json({ error: 'REGISTRATION_FAILED: Neural designation already in use.' });
    }
  }

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;
    console.log('🔑 LOGIN ATTEMPT:', username);

    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      console.log('👤 USER FOUND:', user ? 'YES' : 'NO');

      if (!user) {
        return res.status(401).json({ error: 'AUTHENTICATION_FAILED: User not found.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('🔐 PASSWORD MATCH:', passwordMatch);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'AUTHENTICATION_FAILED: Invalid password.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'hackathon-jury-key-2024',
        { expiresIn: '24h' }
      );

      delete user.password;
      console.log('✅ LOGIN SUCCESS:', username);
      res.json({ user, token });
    } catch (err: any) {
      console.error('❌ LOGIN ERROR:', err);
      res.status(500).json({ 
        error: 'SYSTEM_FAILURE: Could not verify identity.',
        detail: err.message 
      });
    }
  }
}
