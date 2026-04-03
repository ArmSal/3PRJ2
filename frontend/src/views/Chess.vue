<template>
  <div class="chess-container glass-card">
    <div class="header">
      <button @click="leaveGame" class="btn-back">⬅ Back</button>
      <h2>Chess Blitz ♟️</h2>
    </div>
    
    <div v-if="!gameStarted && !isWaiting" class="lobby">
      <h3>Ready to play chess?</h3>
      <button @click="createGame" class="btn-primary">Create New Game</button>
    </div>

    <div v-else-if="isWaiting" class="lobby">
      <h3>Waiting for opponent to join...</h3>
    </div>

    <div v-else-if="!gameOver && board" class="game-area">
      <div class="score-panel">
        <span>Turn: {{ turn === 'w' ? 'White' : 'Black' }}</span>
      </div>
      
      <div class="chess-board">
        <div v-for="(row, y) in board" :key="y" class="board-row">
          <div 
            v-for="(cell, x) in row" 
            :key="x"
            class="board-cell"
            :class="{ 'black-cell': (x + y) % 2 === 1, 'selected': selected && selected.x === x && selected.y === y }"
            @click="clickCell(x, y)"
          >
            <span class="piece" v-if="cell">{{ getPieceSymbol(cell) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="gameOver" class="game-over">
      <h2>Game Over!</h2>
      <h3>{{ winnerMessage }}</h3>
      <button @click="resetGame" class="btn-primary">Play Again</button>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  data() {
    return {
      socket: null,
      myGameId: null,
      gameStarted: false,
      isWaiting: false,
      gameOver: false,
      board: null,
      turn: 'w',
      selected: null,
      winner: null,
      userId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id
    };
  },
  computed: {
    winnerMessage() {
      if (!this.winner) return "It's a tie!";
      return parseInt(this.winner) === this.userId ? "You Win!" : "Opponent Wins!";
    }
  },
  mounted() {
    this.connectSocket();
    const joinId = this.$route.query.join;
    if (joinId) {
      this.joinGame(joinId);
    }
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect();
  },
  methods: {
    connectSocket() {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
      const token = localStorage.getItem('token');
      if (token) this.socket.emit('authenticate', token);
      
      this.socket.on('game-created', (data) => {
        this.myGameId = data.gameId;
        this.isWaiting = true;
      });
      
      this.socket.on('game-started', (data) => {
        this.gameStarted = true;
        this.isWaiting = false;
        this.myGameId = data.gameId;
      });
      
      this.socket.on('chess-state', (state) => {
        this.board = state.board;
        this.turn = state.turn;
        this.gameOver = state.gameOver;
      });
      
      this.socket.on('game-ended', (data) => {
        this.gameOver = true;
        this.winner = data.winner;
      });
      
      this.socket.on('error', (data) => {
        alert(data.message);
      });
    },
    createGame() {
      this.socket.emit('create-game', { channelId: 1, gameType: 'chess' });
    },
    joinGame(gameId) {
      this.socket.emit('join-game', { gameId });
    },
    leaveGame() {
      this.$router.push('/games');
    },
    clickCell(x, y) {
      if (this.selected) {
        if (this.selected.x !== x || this.selected.y !== y) {
          this.socket.emit('chess-move', {
            gameId: this.myGameId,
            from: this.selected,
            to: { x, y }
          });
        }
        this.selected = null;
      } else {
        if (this.board[y][x]) {
            this.selected = { x, y };
        }
      }
    },
    resetGame() {
      this.gameStarted = false;
      this.gameOver = false;
      this.isWaiting = false;
      this.board = null;
    },
    getPieceSymbol(piece) {
      const symbols = {
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
      };
      return symbols[piece] || '';
    }
  }
};
</script>

<style scoped>
.chess-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 40px;
  border-radius: 24px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.btn-back {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-back:hover {
  background: rgba(255,255,255,0.1);
}

.lobby, .game-over {
  text-align: center;
}

.score-panel {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 18px;
}

.chess-board {
  display: flex;
  flex-direction: column;
  border: 4px solid var(--border-glass);
  width: 400px;
  margin: 0 auto;
}

.board-row {
  display: flex;
}

.board-cell {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0d9b5; /* Light square */
  cursor: pointer;
  user-select: none;
}

.board-cell.black-cell {
  background: #b58863; /* Dark square */
}

.board-cell.selected {
  background: rgba(0, 255, 0, 0.5);
}

.piece {
  font-size: 36px;
  color: black;
}

.btn-primary {
  padding: 12px 24px;
  background-color: var(--neon-blue);
  color: black;
  border: none;
  font-weight: bold;
  cursor: pointer;
  border-radius: 8px;
}
.btn-primary:hover {
  background-color: #00b0d0;
}
</style>
