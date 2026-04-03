import { query } from '../config/db';
import { Server } from 'socket.io';

interface PongState {
  gameId: string;
  player1: number;
  player2: number;
  ball: { x: number, y: number, vx: number, vy: number, radius: number };
  paddle1Y: number;
  paddle2Y: number;
  score1: number;
  score2: number;
  countdown: number;
  gameOver: boolean;
  interval?: NodeJS.Timeout;
}

export class PongService {
  private games: Map<string, PongState> = new Map();
  private readonly WIDTH = 800;
  private readonly HEIGHT = 400;
  private readonly PADDLE_HEIGHT = 100;
  private readonly PADDLE_WIDTH = 10;

  createGame(gameId: string, player1: number, player2: number, io: Server): PongState {
    const state: PongState = {
      gameId,
      player1,
      player2,
      ball: { x: 400, y: 200, vx: 5, vy: 3, radius: 8 },
      paddle1Y: 150,
      paddle2Y: 150,
      score1: 0,
      score2: 0,
      countdown: 5,
      gameOver: false
    };

    state.interval = setInterval(() => this.update(gameId, io), 1000 / 60);
    this.games.set(gameId, state);
    return state;
  }

  getGame(gameId: string): PongState | undefined {
    return this.games.get(gameId);
  }

  movePaddle(gameId: string, playerNum: 1 | 2, direction: 'up' | 'down'): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver) return;

    const speed = 25;
    if (playerNum === 1) {
      state.paddle1Y = Math.max(0, Math.min(this.HEIGHT - this.PADDLE_HEIGHT, state.paddle1Y + (direction === 'up' ? -speed : speed)));
    } else {
      state.paddle2Y = Math.max(0, Math.min(this.HEIGHT - this.PADDLE_HEIGHT, state.paddle2Y + (direction === 'up' ? -speed : speed)));
    }
  }

  private update(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver) return;

    if (state.countdown > 0) {
      state.countdown -= (1 / 60);
    } else {
      // Ball movement only if countdown finished
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;
    }

    // Wall collision
    if (state.ball.y <= 0 || state.ball.y >= this.HEIGHT) {
      state.ball.vy *= -1;
    }

    // Paddle collision
    if (state.ball.x <= this.PADDLE_WIDTH + 5) {
      if (state.ball.y >= state.paddle1Y && state.ball.y <= state.paddle1Y + this.PADDLE_HEIGHT) {
        state.ball.vx = Math.abs(state.ball.vx) * 1.05;
      }
    }
    if (state.ball.x >= this.WIDTH - this.PADDLE_WIDTH - 5) {
      if (state.ball.y >= state.paddle2Y && state.ball.y <= state.paddle2Y + this.PADDLE_HEIGHT) {
        state.ball.vx = -Math.abs(state.ball.vx) * 1.05;
      }
    }

    // Scoring
    if (state.ball.x < 0) {
      state.score2++;
      this.resetBall(state);
    } else if (state.ball.x > this.WIDTH) {
      state.score1++;
      this.resetBall(state);
    }

    if (state.score1 >= 10 || state.score2 >= 10) {
      state.gameOver = true;
      this.endGame(gameId, io);
    }

    io.to(gameId).emit('pong-state', {
      ball: state.ball,
      paddle1: { y: state.paddle1Y, height: this.PADDLE_HEIGHT, width: this.PADDLE_WIDTH },
      paddle2: { y: state.paddle2Y, height: this.PADDLE_HEIGHT, width: this.PADDLE_WIDTH },
      score1: state.score1,
      score2: state.score2,
      countdown: Math.max(0, Math.ceil(state.countdown)),
      gameOver: state.gameOver
    });
  }

  private resetBall(state: PongState): void {
    state.ball = { x: 400, y: 200, vx: (Math.random() > 0.5 ? 5 : -5), vy: (Math.random() * 4 - 2), radius: 8 };
  }

  private async endGame(gameId: string, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;

    if (state.interval) clearInterval(state.interval);
    
    const winnerId = state.score1 >= 10 ? state.player1 : state.player2;
    
    try {
      // Update Leaderboards
      await query('UPDATE leaderboards SET score = score + 10 WHERE user_id = $1 AND game_type = $2', [winnerId, 'pong']);
      io.to(gameId).emit('game-ended', { winner: winnerId });
    } catch (err) {
      console.error('Failed to persist game results:', err);
    }

    this.games.delete(gameId);
  }
}

export default new PongService();
