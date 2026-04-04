import { Server } from 'socket.io';
import { SnakeState, Point } from '../types';
import { query } from '../config/db';

interface GameInstance {
  state: SnakeState;
  player1Id: number;
  player2Id: number;
  interval?: NodeJS.Timeout;
}

export class SnakeService {
  private games: Map<string, GameInstance> = new Map();
  private readonly GRID_COUNT = 20;
  private readonly TICK_RATE = 200; // Slower tick for better control
  private readonly TOTAL_TIME = 180; // 3 minutes

  createGame(gameId: string, player1Id: number, player2Id: number, io: Server): SnakeState {
    const initialState: SnakeState = {
      snake1: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
      snake2: [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }],
      food: { x: 10, y: 10 },
      score1: 0,
      score2: 0,
      countdown: 5,
      timeRemaining: this.TOTAL_TIME,
      gameOver: false,
      dir1: 'right',
      dir2: 'left'
    };

    const instance: GameInstance = {
      state: initialState,
      player1Id,
      player2Id,
      interval: setInterval(() => this.tick(gameId, io), this.TICK_RATE)
    };

    this.games.set(gameId, instance);
    return initialState;
  }

  getGameState(gameId: string): SnakeState | undefined {
    return this.games.get(gameId)?.state;
  }

  setDirection(gameId: string, userId: number, direction: string): void {
    const instance = this.games.get(gameId);
    if (!instance || instance.state.gameOver) return;

    const playerNum = userId === instance.player1Id ? 1 : (userId === instance.player2Id ? 2 : 0);
    if (playerNum === 0) return;

    if (playerNum === 1) {
      if (direction === 'up' && instance.state.dir1 !== 'down') instance.state.dir1 = 'up';
      if (direction === 'down' && instance.state.dir1 !== 'up') instance.state.dir1 = 'down';
      if (direction === 'left' && instance.state.dir1 !== 'right') instance.state.dir1 = 'left';
      if (direction === 'right' && instance.state.dir1 !== 'left') instance.state.dir1 = 'right';
    } else {
      if (direction === 'up' && instance.state.dir2 !== 'down') instance.state.dir2 = 'up';
      if (direction === 'down' && instance.state.dir2 !== 'up') instance.state.dir2 = 'down';
      if (direction === 'left' && instance.state.dir2 !== 'right') instance.state.dir2 = 'left';
      if (direction === 'right' && instance.state.dir2 !== 'left') instance.state.dir2 = 'right';
    }
  }

  private tick(gameId: string, io: Server): void {
    const instance = this.games.get(gameId);
    if (!instance) return;

    const state = instance.state;
    if (state.gameOver) return;

    // 1. Countdown Protocol
    if (state.countdown > 0) {
      state.countdown -= (this.TICK_RATE / 1000);
      io.to(gameId).emit('snake-state', state);
      return;
    }

    // 2. Tactical Timer
    state.timeRemaining -= (this.TICK_RATE / 1000);
    if (state.timeRemaining <= 0) {
      state.gameOver = true;
      this.finishGame(gameId, io);
      return;
    }

    // 3. Autonomous Advancement
    this.advanceSnake(state, 1);
    this.advanceSnake(state, 2);

    // 4. Collision Processing
    const c1 = this.checkTotalCollision(state, 1);
    const c2 = this.checkTotalCollision(state, 2);

    if (c1 || c2) {
      state.gameOver = true;
      this.finishGame(gameId, io);
    }

    io.to(gameId).emit('snake-state', state);
  }

  private advanceSnake(state: SnakeState, player: 1 | 2): void {
    const snake = player === 1 ? state.snake1 : state.snake2;
    const dir = player === 1 ? state.dir1 : state.dir2;
    const head = { ...snake[0] };

    if (dir === 'up') head.y--;
    else if (dir === 'down') head.y++;
    else if (dir === 'left') head.x--;
    else if (dir === 'right') head.x++;

    snake.unshift(head);

    if (head.x === state.food.x && head.y === state.food.y) {
      if (player === 1) state.score1 += 10;
      else state.score2 += 10;
      state.food = this.generateFood(state);
    } else {
      snake.pop();
    }
  }

  private checkTotalCollision(state: SnakeState, player: 1 | 2): boolean {
    const snake = player === 1 ? state.snake1 : state.snake2;
    const opponent = player === 1 ? state.snake2 : state.snake1;
    const head = snake[0];

    // Wall Frame
    if (head.x < 0 || head.x >= this.GRID_COUNT || head.y < 0 || head.y >= this.GRID_COUNT) return true;

    // Self Body
    for (let i = 1; i < snake.length; i++) {
       if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }

    // Opponent Body (Ignore Head/First square)
    for (let i = 1; i < opponent.length; i++) {
       if (head.x === opponent[i].x && head.y === opponent[i].y) return true;
    }

    return false;
  }

  private generateFood(state: SnakeState): Point {
    let newFood: Point;
    while (true) {
      newFood = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
      const onS1 = state.snake1.some(s => s.x === newFood.x && s.y === newFood.y);
      const onS2 = state.snake2.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onS1 && !onS2) break;
    }
    return newFood;
  }

  private async finishGame(gameId: string, io: Server): Promise<void> {
    const instance = this.games.get(gameId);
    if (!instance) return;
    if (instance.interval) clearInterval(instance.interval);

    let winnerId = instance.state.score1 > instance.state.score2 ? instance.player1Id : instance.player2Id;
    if (instance.state.score1 === instance.state.score2) winnerId = instance.player1Id;

    try {
      await query('UPDATE leaderboards SET score = score + 20 WHERE user_id = $1 AND game_type = $2', [winnerId, 'snake']);
      io.to(gameId).emit('game-ended', { winner: winnerId });
    } catch (e) {
      console.error('Failed persistence:', e);
    }
    this.games.delete(gameId);
  }

  endGame(gameId: string): void {
    const instance = this.games.get(gameId);
    if (instance?.interval) clearInterval(instance.interval);
    this.games.delete(gameId);
  }
}

export default new SnakeService();
