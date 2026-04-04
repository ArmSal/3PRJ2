export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
}

export interface Channel {
  id: number;
  name: string;
  type: 'tactical' | 'unit' | 'global';
  icon: string;
}

export interface Message {
  channelId: number;
  userId: number;
  username: string;
  content: string;
  created_at: string;
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
  countdown: number;
  timeRemaining: number;
  gameOver: boolean;
  dir1: string;
  dir2: string;
}

export interface Game {
  gameId: string;
  gameType: string;
  player1: string;
  player1Id: number;
  player2?: string;
  player2Id?: number;
}
