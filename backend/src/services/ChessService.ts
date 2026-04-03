import { query } from '../config/db';
import { Server } from 'socket.io';

interface ChessState {
  gameId: string;
  player1: number;
  player2: number;
  board: string[][];
  turn: 'w' | 'b';
  gameOver: boolean;
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

  createGame(gameId: string, player1: number, player2: number, io: Server): ChessState {
    const state: ChessState = {
      gameId,
      player1,
      player2,
      board: this.initialBoard(),
      turn: 'w',
      gameOver: false
    };

    this.games.set(gameId, state);
    this.broadcastState(gameId, io);
    return state;
  }

  move(gameId: string, userId: number, from: { x: number, y: number }, to: { x: number, y: number }, io: Server): void {
    const state = this.games.get(gameId);
    if (!state || state.gameOver) return;

    const isWhite = userId === state.player1;
    if (isWhite && state.turn !== 'w') return;
    if (!isWhite && state.turn !== 'b') return;

    const piece = state.board[from.y][from.x];
    if (!piece) return;

    // Validate simple color ownership
    if (isWhite && piece === piece.toLowerCase()) return;
    if (!isWhite && piece === piece.toUpperCase()) return;

    const targetPiece = state.board[to.y][to.x];
    
    // Capture King = Instant Win (Blitz Rule)
    if (targetPiece && targetPiece.toLowerCase() === 'k') {
      state.board[to.y][to.x] = piece;
      state.board[from.y][from.x] = '';
      state.gameOver = true;
      this.endGame(gameId, userId, io);
      return;
    }

    state.board[to.y][to.x] = piece;
    state.board[from.y][from.x] = '';
    state.turn = state.turn === 'w' ? 'b' : 'w';
    
    this.broadcastState(gameId, io);
  }

  private broadcastState(gameId: string, io: Server): void {
    const state = this.games.get(gameId);
    if (!state) return;

    io.to(`game-${gameId}`).emit('chess-state', {
      board: state.board,
      turn: state.turn,
      gameOver: state.gameOver
    });
  }

  private async endGame(gameId: string, winnerId: number, io: Server): Promise<void> {
    const state = this.games.get(gameId);
    if (!state) return;

    try {
      await query('UPDATE leaderboards SET score = score + 10 WHERE user_id = $1 AND game_type = $2', [winnerId, 'chess']);
      io.to(`game-${gameId}`).emit('game-ended', { winner: winnerId });
    } catch (err) {
      console.error('Failed to persist chess results:', err);
    }

    this.games.delete(gameId);
  }
}

export default new ChessService();
