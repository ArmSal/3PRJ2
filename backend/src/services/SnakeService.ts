import { SnakeState, Point } from '../types';

export class SnakeService {
  private games: Map<string, SnakeState> = new Map();
  private readonly GRID_SIZE = 20;

  createGame(gameId: string): SnakeState {
    const initialState: SnakeState = {
      snake1: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
      snake2: [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }],
      food: { x: 10, y: 10 },
      score1: 0,
      score2: 0,
      gameOver: false
    };
    this.games.set(gameId, initialState);
    return initialState;
  }

  getGameState(gameId: string): SnakeState | undefined {
    return this.games.get(gameId);
  }

  moveSnake(gameId: string, player: 1 | 2, direction: string): SnakeState | undefined {
    const state = this.games.get(gameId);
    if (!state || state.gameOver) return state;

    const snake = player === 1 ? state.snake1 : state.snake2;
    const head: Point = { ...snake[0] };

    switch (direction) {
      case 'up': head.y -= 1; break;
      case 'down': head.y += 1; break;
      case 'left': head.x -= 1; break;
      case 'right': head.x += 1; break;
    }

    // Boundary & Self-Collision Check
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || this.checkCollision(head, snake)) {
      state.gameOver = true;
      return state;
    }

    snake.unshift(head);

    // Food Collision
    if (head.x === state.food.x && head.y === state.food.y) {
      if (player === 1) state.score1 += 10;
      else state.score2 += 10;
      state.food = this.generateFood(state);
    } else {
      snake.pop();
    }

    return state;
  }

  private checkCollision(head: Point, snake: Point[]): boolean {
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }

  private generateFood(state: SnakeState): Point {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
      };
      const onSnake1 = state.snake1.some(s => s.x === newFood.x && s.y === newFood.y);
      const onSnake2 = state.snake2.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake1 && !onSnake2) break;
    }
    return newFood;
  }

  endGame(gameId: string): void {
    this.games.delete(gameId);
  }
}

export default new SnakeService();
