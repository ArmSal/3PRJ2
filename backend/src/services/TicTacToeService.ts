import { Server } from 'socket.io';
import { query } from '../config/db';

interface TTTState {
  board: (string | null)[]; // 9 cells
  turn: number; // userId of current player
  player1: number;
  player1Name: string;
  player2: number;
  player2Name: string;
  countdown: number;
  gameOver: boolean;
  winner: number | null;
  interval?: NodeJS.Timeout;
}

export class TicTacToeService {
  private games: Map<string, TTTState> = new Map();

  createGame(gameId: string, player1Id: number, player1Name: string, player2Id: number, player2Name: string, io: Server): TTTState {
    const state: TTTState = {
      board: Array(9).fill(null),
      turn: player1Id,
      player1: player1Id,
      player1Name,
      player2: player2Id,
      player2Name,
      countdown: 5,
      gameOver: false,
      winner: null
    };

    state.interval = setInterval(() => this.tick(gameId, io), 1000 / 10); // 10Hz tick for countdown
    this.games.set(gameId, state);
    return state;
  }

  getGame(gameId: string): TTTState | undefined {
    return this.games.get(gameId);
  }

  makeMove(gameId: string, userId: number, index: number, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver || state.countdown > 0) return;
    if (state.turn !== userId) return;
    if (state.board[index] !== null) return;

    state.board[index] = userId === state.player1 ? 'X' : 'O';
    
    if (this.checkWin(state.board)) {
      state.gameOver = true;
      state.winner = userId;
      this.finishGame(gameId, io);
    } else if (state.board.every(cell => cell !== null)) {
      state.gameOver = true;
      state.winner = null; // Draw
      this.finishGame(gameId, io);
    } else {
      state.turn = userId === state.player1 ? state.player2 : state.player1;
    }

    io.to(gameId).emit('ttt-state', this.formatState(state));
  }

  private tick(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    if (state.countdown > 0) {
      state.countdown -= 0.1;
      io.to(gameId).emit('ttt-state', this.formatState(state));
    }
  }

  private checkWin(board: (string | null)[]): boolean {
    const wins = [
      [0,1,2], [3,4,5], [6,7,8], // Rows
      [0,3,6], [1,4,7], [2,5,8], // Cols
      [0,4,8], [2,4,6]           // Diagonals
    ];
    return wins.some(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  }

  private formatState(state: TTTState) {
    return {
      board: state.board,
      turn: state.turn,
      player1Name: state.player1Name,
      player2Name: state.player2Name,
      countdown: Math.max(0, Math.ceil(state.countdown)),
      gameOver: state.gameOver,
      winner: state.winner
    };
  }

  private async finishGame(gameId: string, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;
    if (state.interval) clearInterval(state.interval);

    try {
      if (state.winner) {
        await query('UPDATE leaderboards SET score = score + 5 WHERE user_id = $1 AND game_type = $2', [state.winner, 'ttt']);
      }
      io.to(gameId).emit('game-ended', { winner: state.winner });
    } catch (e) { console.error(e); }
  }

  endGame(gameId: string): void {
    const state = this.games.get(gameId);
    if (state?.interval) clearInterval(state.interval);
    this.games.delete(gameId);
  }
}

export default new TicTacToeService();
