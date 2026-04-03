export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  count_elo?: number;
}

export interface Guild {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  unread?: boolean;
}

export interface Message {
  id?: number;
  channelId: number | string;
  content: string;
  userId: number;
  username: string;
  created_at?: string;
}

export interface Game {
  gameId: string;
  gameType: 'snake' | 'pong' | 'trivia' | 'chess';
  player1: string;
  player1Id: number;
  player2?: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface SnakeState {
  snake1: Array<{ x: number, y: number }>;
  snake2: Array<{ x: number, y: number }>;
  food: { x: number, y: number };
  score1: number;
  score2: number;
  gameOver: boolean;
}
