import { query } from '../config/db';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

interface ChessState {
  gameId: string;
  player1: number;
  player1Name: string;
  player2: number;
  player2Name: string;
  engine: Chess;
  board: string[][];
  turn: 'w' | 'b';
  countdown: number;
  gameOver: boolean;
  selected: { x: number, y: number } | null;
  interval?: NodeJS.Timeout;
}

export class ChessService {
  private games: Map<string, ChessState> = new Map();

  private coordsToSquare(x: number, y: number): string {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rank = 8 - y;
    return `${files[x]}${rank}`;
  }

  private getBoard(engine: Chess): string[][] {
    const freshBoard = engine.board();
    const result: string[][] = [];
    for (let i = 0; i < 8; i++) {
        const row: string[] = [];
        for (let j = 0; j < 8; j++) {
            const pieceObj = freshBoard[i][j];
            if (!pieceObj) {
                row.push('');
            } else {
                if (pieceObj.color === 'w') {
                    row.push(pieceObj.type.toUpperCase());
                } else {
                    row.push(pieceObj.type.toLowerCase());
                }
            }
        }
        result.push(row);
    }
    return result;
  }

  createGame(gameId: string, player1Id: number, player1Name: string, player2Id: number, player2Name: string, io: Server): ChessState {
    const engine = new Chess();
    const state: ChessState = {
      gameId,
      player1: player1Id,
      player1Name,
      player2: player2Id,
      player2Name,
      engine,
      board: this.getBoard(engine),
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
    if (isWhite && state.engine.turn() !== 'w') return;
    if (!isWhite && state.engine.turn() !== 'b') return;

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
    const fromSquare = this.coordsToSquare(from.x, from.y);
    const toSquare = this.coordsToSquare(pos.x, pos.y);

    try {
        const move = state.engine.move({
            from: fromSquare,
            to: toSquare,
            promotion: 'q'
        });
        
        if (move) {
           state.board = this.getBoard(state.engine);
           state.turn = state.engine.turn();
           state.selected = null;
           
           if (state.engine.isGameOver()) {
               state.gameOver = true;
               if (state.engine.isCheckmate()) {
                    this.endGame(gameId, userId, io);
               } else {
                    if (state.interval) clearInterval(state.interval);
                    io.to(gameId).emit('chess-state', {
                      ...state,
                      gameOver: true
                    });
               }
           }
           this.broadcastState(gameId, io);
        } else {
           throw new Error("Invalid move returned null");
        }
    } catch (e) {
        // Handle invalid move target, might just be clicking a different piece to select it
        const targetPiece = state.board[pos.y][pos.x];
        if (targetPiece) {
            if (isWhite && targetPiece === targetPiece.toUpperCase()) {
                state.selected = pos;
            } else if (!isWhite && targetPiece === targetPiece.toLowerCase()) {
                state.selected = pos;
            } else {
                state.selected = null;
            }
        } else {
            state.selected = null;
        }
        this.broadcastState(gameId, io);
    }
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
