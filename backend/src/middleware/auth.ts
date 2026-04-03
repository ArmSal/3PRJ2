import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // FIX: Using the correct express.Request header method
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'NEURAL_LINK_FAILED: No authorization token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'hackathon-jury-key-2024';
    console.log(`🔍 [AUTH-INTERCEPT] Attempting verification for token ending in ...${token?.slice(-10)}`);
    console.log(`🔐 [AUTH-INTERCEPT] Using secret default? ${!process.env.JWT_SECRET}`);
    
    const decoded = jwt.verify(token, secret) as { id: number; username: string };
    
    req.user = decoded;
    console.log(`✅ [AUTH-SUCCESS] User ${decoded.username} verified.`);
    next();
  } catch (err) {
    console.warn('⚠️ [AUTH-REJECTED] JWT Verification failed:', (err as any).message);
    res.status(401).json({ error: 'NEURAL_LINK_FAILED: Authorization protocol rejected' });
  }
};

export default authMiddleware;
