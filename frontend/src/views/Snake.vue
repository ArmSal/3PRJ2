<template>
  <div class="snake-container">
    <h1>Snake Multiplayer</h1>
    
    <!-- LOBBY -->
    <div v-if="!inGame" class="lobby">
      <div class="lobby-section">
        <h2>Créer une partie</h2>
        <button @click="createGame" class="create-btn">Créer Game</button>
      </div>
      
      <div class="lobby-section">
        <h2>Rejoindre une partie</h2>
        <div v-if="availableGames.length === 0" class="no-games">
          Aucune partie en attente
        </div>
        <div v-else class="games-list">
          <div v-for="game in availableGames" :key="game.gameId" class="game-card">
            <span>{{ game.gameType }} - {{ game.player1 }}</span>
            <button @click="joinGame(game.gameId)" class="join-btn">Rejoindre</button>
          </div>
        </div>
      </div>
      
      <div v-if="myGameId" class="my-game">
        <p>Votre partie #{{ myGameId }} est en attente...</p>
      </div>
    </div>
    
    <!-- GAME -->
    <div v-else class="game-area">
      <div class="game-info">
        <span class="player-role">Vous êtes {{ playerRole }}</span>
        <div class="score-board">
          <span class="score-p1">P1: {{ score1 }}</span>
          <span class="score-p2">P2: {{ score2 }}</span>
        </div>
        <button @click="leaveGame" class="leave-btn">Quitter</button>
      </div>
      <canvas ref="snakeCanvas" width="400" height="400"></canvas>
      <div class="controls">
        <span>Contrôles: <strong>↑ ↓ ← →</strong> ou <strong>W S A D</strong></span>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3000'
const GRID_SIZE = 20
const TILE_COUNT = 20

export default {
  name: 'Snake',
  data() {
    return {
      socket: null,
      canvas: null,
      ctx: null,
      animationId: null,
      inGame: false,
      myGameId: null,
      playerRole: '',
      availableGames: [],
      score1: 0,
      score2: 0,
      gameState: {
        snake1: [{ x: 5, y: 10 }],
        snake2: [{ x: 15, y: 10 }],
        food: { x: 10, y: 10 },
        gameOver: false
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.snakeCanvas
    this.ctx = this.canvas?.getContext('2d')
    
    window.addEventListener('keydown', this.handleKeyDown)
    
    this.connectSocket()
    this.gameLoop()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
    cancelAnimationFrame(this.animationId)
    this.socket?.disconnect()
  },
  methods: {
    connectSocket() {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      })
      
      const token = localStorage.getItem('token')
      if (token) {
        this.socket.emit('authenticate', token)
      }
      
      this.socket.on('game-created', (data) => {
        this.myGameId = data.gameId
      })
      
      this.socket.on('game-available', (game) => {
        this.availableGames.push(game)
      })
      
      this.socket.on('game-started', (data) => {
        this.inGame = true
        this.myGameId = data.gameId
        const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id
        this.playerRole = data.player1 === userId ? 'Joueur 1' : 'Joueur 2'
      })
      
      this.socket.on('snake-state', (state) => {
        this.gameState = state
        this.score1 = state.score1 || 0
        this.score2 = state.score2 || 0
      })
      
      this.socket.on('game-ended', (data) => {
        alert(`Partie terminée ! Gagnant: ${data.winner}`)
        this.leaveGame()
      })
      
      this.socket.on('error', (data) => {
        alert('Erreur: ' + data.message)
      })
    },
    
    createGame() {
      this.socket.emit('create-game', { channelId: 1, gameType: 'snake' })
    },
    
    joinGame(gameId) {
      this.socket.emit('join-game', { gameId })
    },
    
    leaveGame() {
      this.inGame = false
      this.myGameId = null
      this.playerRole = ''
      this.availableGames = []
    },
    
    handleKeyDown(e) {
      if (!this.inGame) return
      
      const keyMap = {
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right'
      }
      
      const direction = keyMap[e.key]
      if (direction) {
        this.socket.emit('snake-move', { 
          gameId: this.myGameId, 
          direction 
        })
      }
    },
    
    draw() {
      if (!this.ctx) return
      
      // Clear
      this.ctx.fillStyle = '#16213e'
      this.ctx.fillRect(0, 0, 400, 400)
      
      // Grid
      this.ctx.strokeStyle = '#1a1a2e'
      this.ctx.lineWidth = 0.5
      for (let i = 0; i < TILE_COUNT; i++) {
        this.ctx.beginPath()
        this.ctx.moveTo(i * GRID_SIZE, 0)
        this.ctx.lineTo(i * GRID_SIZE, 400)
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(0, i * GRID_SIZE)
        this.ctx.lineTo(400, i * GRID_SIZE)
        this.ctx.stroke()
      }
      
      // Food
      this.ctx.fillStyle = '#e94560'
      this.ctx.beginPath()
      this.ctx.arc(
        this.gameState.food.x * GRID_SIZE + GRID_SIZE / 2,
        this.gameState.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
      )
      this.ctx.fill()
      
      // Snake 1
      this.ctx.fillStyle = '#4CAF50'
      this.gameState.snake1?.forEach((segment, i) => {
        this.ctx.fillRect(
          segment.x * GRID_SIZE + 1,
          segment.y * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2
        )
      })
      
      // Snake 2
      this.ctx.fillStyle = '#2196F3'
      this.gameState.snake2?.forEach((segment, i) => {
        this.ctx.fillRect(
          segment.x * GRID_SIZE + 1,
          segment.y * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2
        )
      })
    },
    
    gameLoop() {
      this.draw()
      this.animationId = requestAnimationFrame(this.gameLoop)
    }
  }
}
</script>

<style scoped>
.snake-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
}

h1 {
  margin-bottom: 20px;
  color: #fff;
}

.lobby {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 500px;
}

.lobby-section {
  background: #16213e;
  padding: 20px;
  border-radius: 8px;
}

.lobby-section h2 {
  color: #4CAF50;
  margin-bottom: 15px;
}

.create-btn, .join-btn {
  background: #4CAF50;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.join-btn {
  background: #2196F3;
  padding: 8px 16px;
}

.no-games {
  color: #888;
  font-style: italic;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.game-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1a1a2e;
  padding: 12px;
  border-radius: 4px;
}

.my-game {
  background: #0f3460;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 400px;
  margin-bottom: 10px;
  gap: 20px;
}

.player-role {
  color: #4CAF50;
  font-weight: bold;
}

.score-board {
  display: flex;
  gap: 20px;
}

.score-p1 {
  color: #4CAF50;
}

.score-p2 {
  color: #2196F3;
}

.leave-btn {
  background: #ff6b6b;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

canvas {
  border: 2px solid #444;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.controls {
  margin-top: 20px;
  padding: 15px 30px;
  background: #16213e;
  border-radius: 8px;
}

.controls strong {
  color: #4CAF50;
}
</style>
