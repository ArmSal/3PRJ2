import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  created_at?: Date;
}

export interface GameMetadata {
  gameId: string;
  gameType: string;
  player1: number;
  player2?: number;
  status: 'waiting' | 'playing' | 'finished';
}

// FIX: Specifically extending from express.Request, not the global web Request
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface SnakeState {
  snake1: Point[];
  snake2: Point[];
  food: Point;
  score1: number;
  score2: number;
  gameOver: boolean;
}

export interface PongState {
  ball: Point;
  paddle1: number;
  paddle2: number;
  score1: number;
  score2: number;
  gameOver: boolean;
}

export interface TriviaState {
  question: string;
  options: string[];
  correctIndex: number;
  player1Score: number;
  player2Score: number;
  timer: number;
}

export interface ChessState {
  fen: string;
  turn: 'w' | 'b';
  history: string[];
}
