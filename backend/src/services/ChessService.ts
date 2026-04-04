import { query } from '../config/db';
import { Server } from 'socket.io';

interface ChessState {
  gameId: string;
  player1: number;
  player1Name: string;
  player2: number;
  player2Name: string;
  board: string[][];
  turn: 'w' | 'b';
  countdown: number;
  gameOver: boolean;
  selected: { x: number, y: number } | null;
  interval?: NodeJS.Timeout;
}

export class ChessService {
  private games: Map<string, ChessState> = new Map();

  private initialBoard(): string[][] {
    return [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['','','','','','','',''],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R']
    ];
  }

  createGame(gameId: string, player1Id: number, player1Name: string, player2Id: number, player2Name: string, io: Server): ChessState {
    const state: ChessState = {
      gameId,
      player1: player1Id,
      player1Name,
      player2: player2Id,
      player2Name,
      board: this.initialBoard(),
      turn: 'w',
      countdown: 5,
      gameOver: false,
      selected: null
    };

    state.interval = setInterval(() => this.tick(gameId, io), 1000 / 10);
    this.games.set(gameId, state);
    return state;
  }

  private tick(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    if (state.countdown > 0) {
      state.countdown -= 0.1;
      this.broadcastState(gameId, io);
    }
  }

  handleMove(gameId: string, userId: number, pos: { x: number, y: number }, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver || state.countdown > 0) return;

    const isWhite = userId === state.player1;
    if (isWhite && state.turn !== 'w') return;
    if (!isWhite && state.turn !== 'b') return;

    // Selection Phase
    if (!state.selected) {
      const piece = state.board[pos.y][pos.x];
      if (!piece) return;
      if (isWhite && piece === piece.toLowerCase()) return;
      if (!isWhite && piece === piece.toUpperCase()) return;
      state.selected = pos;
      this.broadcastState(gameId, io);
      return;
    }

    // Move Phase
    const from = state.selected;
    const piece = state.board[from.y][from.x];
    const target = state.board[pos.y][pos.x];

    // Simple Move logic (Standard rules assumed handled by frontend validation later, 
    // but here we just process the strike for MVP)
    if (target && target.toLowerCase() === 'k') {
      state.board[pos.y][pos.x] = piece;
      state.board[from.y][from.x] = '';
      state.gameOver = true;
      this.endGame(gameId, userId, io);
    } else {
      state.board[pos.y][pos.x] = piece;
      state.board[from.y][from.x] = '';
      state.turn = state.turn === 'w' ? 'b' : 'w';
    }

    state.selected = null;
    this.broadcastState(gameId, io);
  }

  private broadcastState(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    io.to(gameId).emit('chess-state', {
      board: state.board,
      turn: state.turn,
      player1Name: state.player1Name,
      player2Name: state.player2Name,
      selected: state.selected,
      countdown: Math.max(0, Math.ceil(state.countdown)),
      gameOver: state.gameOver
    });
  }

  private async endGame(gameId: string, winnerId: number, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;
    if (state.interval) clearInterval(state.interval);

    try {
      await query('UPDATE leaderboards SET score = score + 20 WHERE user_id = $1 AND game_type = $2', [winnerId, 'chess']);
      io.to(gameId).emit('game-ended', { winner: winnerId });
    } catch (err) { console.error(err); }
  }
}

export default new ChessService();
