<template>
  <div class="pong-container">
    <h1>Pong Multiplayer</h1>
    
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
        <button @click="leaveGame" class="leave-btn">Quitter</button>
      </div>
      <div class="score">
        <span class="player1">Joueur 1: {{ score1 }}</span>
        <span class="player2">Joueur 2: {{ score2 }}</span>
      </div>
      <canvas ref="pongCanvas" width="800" height="400"></canvas>
      <div class="controls">
        <div class="control-group">
          <span>Contrôles: <strong>{{ playerRole === 'Joueur 1' ? 'W / S' : '↑ / ↓' }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3000'

export default {
  name: 'Pong',
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
      keys: {},
      gameState: {
        ballX: 400,
        ballY: 200,
        paddle1Y: 160,
        paddle2Y: 160
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.pongCanvas
    this.ctx = this.canvas?.getContext('2d')
    
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    
    this.connectSocket()
    this.gameLoop()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    cancelAnimationFrame(this.animationId)
    this.socket?.disconnect()
  },
  methods: {
    connectSocket() {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      })
      
      // Auth avec token
      const token = localStorage.getItem('token')
      if (token) {
        this.socket.emit('authenticate', token)
      }
      
      this.socket.on('authenticated', (data) => {
        console.log('Socket auth:', data)
      })
      
      // Game created
      this.socket.on('game-created', (data) => {
        this.myGameId = data.gameId
      })
      
      // Game available (broadcast)
      this.socket.on('game-available', (game) => {
        this.availableGames.push(game)
      })
      
      // Game started
      this.socket.on('game-started', (data) => {
        this.inGame = true
        this.myGameId = data.gameId
        // Determine role
        const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id
        this.playerRole = data.player1 === userId ? 'Joueur 1' : 'Joueur 2'
      })
      
      // Game state updates
      this.socket.on('pong-state', (state) => {
        this.gameState = state
        this.score1 = state.score1
        this.score2 = state.score2
      })
      
      // Game ended
      this.socket.on('game-ended', (data) => {
        alert(`Partie terminée ! Gagnant: ${data.winner}`)
        this.leaveGame()
      })
      
      // Errors
      this.socket.on('error', (data) => {
        alert('Erreur: ' + data.message)
      })
    },
    
    createGame() {
      // Default to channel 1 for now
      this.socket.emit('create-game', { channelId: 1, gameType: 'pong' })
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
      this.keys[e.key] = true
      
      if (!this.inGame) return
      
      // Send paddle movement
      const direction = e.key === 'w' || e.key === 'ArrowUp' ? -1 : 
                        e.key === 's' || e.key === 'ArrowDown' ? 1 : null
      
      if (direction && this.myGameId) {
        this.socket.emit('pong-move', { 
          gameId: this.myGameId, 
          direction 
        })
      }
    },
    
    handleKeyUp(e) {
      this.keys[e.key] = false
    },
    
    draw() {
      if (!this.ctx) return
      
      // Clear
      this.ctx.fillStyle = '#16213e'
      this.ctx.fillRect(0, 0, 800, 400)
      
      // Center line
      this.ctx.strokeStyle = '#444'
      this.ctx.setLineDash([10, 10])
      this.ctx.beginPath()
      this.ctx.moveTo(400, 0)
      this.ctx.lineTo(400, 400)
      this.ctx.stroke()
      this.ctx.setLineDash([])
      
      // Paddles
      this.ctx.fillStyle = '#e94560'
      this.ctx.fillRect(20, this.gameState.paddle1Y, 15, 80)
      
      this.ctx.fillStyle = '#0f3460'
      this.ctx.fillRect(765, this.gameState.paddle2Y, 15, 80)
      
      // Ball
      this.ctx.beginPath()
      this.ctx.arc(this.gameState.ballX, this.gameState.ballY, 10, 0, Math.PI * 2)
      this.ctx.fillStyle = '#fff'
      this.ctx.fill()
    },
    
    gameLoop() {
      this.draw()
      this.animationId = requestAnimationFrame(this.gameLoop)
    }
  }
}
</script>

<style scoped>
.pong-container {
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

/* LOBBY */
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
  color: #e94560;
  margin-bottom: 15px;
}

.create-btn, .join-btn {
  background: #e94560;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.join-btn {
  background: #0f3460;
  padding: 8px 16px;
}

.create-btn:hover, .join-btn:hover {
  opacity: 0.9;
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

/* GAME */
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 800px;
  margin-bottom: 10px;
}

.player-role {
  color: #e94560;
  font-weight: bold;
}

.leave-btn {
  background: #ff6b6b;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.score {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.player1 {
  color: #e94560;
}

.player2 {
  color: #0f3460;
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
  color: #e94560;
}
</style>
