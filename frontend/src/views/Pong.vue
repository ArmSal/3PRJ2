<template>
  <div class="pong-layout">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <button @click="goBack" class="btn-back">← Back</button>
        <h2>🏓 Pong</h2>
      </div>
      <div class="game-info">
        <div class="score">
          <span class="player">{{ playerName }}</span>
          <span class="score-number">{{ playerScore }}</span>
          <span class="separator">-</span>
          <span class="score-number">{{ opponentScore }}</span>
          <span class="player">{{ opponentName }}</span>
        </div>
        <div class="status">{{ gameStatus }}</div>
      </div>
    </div>

    <!-- Game Area -->
    <div class="game-container">
      <canvas ref="gameCanvas" class="game-canvas"></canvas>
      
      <!-- Game Overlay -->
      <div v-if="!gameStarted" class="game-overlay">
        <div class="overlay-content">
          <h3>{{ isWaiting ? 'Waiting for opponent...' : 'Ready to play?' }}</h3>
          <p v-if="isWaiting">Share this game or wait for someone to join</p>
          <p v-else>Click start to begin the match</p>
          <button v-if="!isWaiting" @click="startGame" class="btn-start">Start Game</button>
          <div v-else class="waiting-animation">
            <span class="dot">.</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
          </div>
        </div>
      </div>

      <!-- Winner Overlay -->
      <div v-if="gameEnded" class="game-overlay winner">
        <div class="overlay-content">
          <h3>🎉 {{ winner }} Wins!</h3>
          <p>Final score: {{ playerScore }} - {{ opponentScore }}</p>
          <button @click="restartGame" class="btn-start">Play Again</button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="control-section">
        <h4>Controls</h4>
        <div class="keys">
          <div class="key-group">
            <span class="key">W</span>
            <span>Move Up</span>
          </div>
          <div class="key-group">
            <span class="key">S</span>
            <span>Move Down</span>
          </div>
        </div>
      </div>
      
      <div class="spectators" v-if="spectators.length > 0">
        <h4>👀 Spectators ({{ spectators.length }})</h4>
        <div class="spectator-list">
          <span v-for="spec in spectators" :key="spec.id" class="spectator">
            {{ spec.username }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  data() {
    return {
      socket: null,
      gameStarted: false,
      gameEnded: false,
      isWaiting: false,
      gameStatus: 'Waiting...',
      playerName: 'You',
      opponentName: 'Opponent',
      playerScore: 0,
      opponentScore: 0,
      winner: '',
      spectators: [],
      
      // Game objects
      canvas: null,
      ctx: null,
      ball: { x: 400, y: 250, dx: 5, dy: 5, radius: 10, speed: 5 },
      paddle1: { x: 20, y: 200, width: 15, height: 100, speed: 8 },
      paddle2: { x: 765, y: 200, width: 15, height: 100, speed: 8 },
      
      // Input
      keys: { w: false, s: false },
      playerPaddle: 1, // 1 or 2
      
      // Interpolation for smooth network sync
      targetBall: { x: 400, y: 250 },
      targetPaddle1: { y: 200 },
      targetPaddle2: { y: 200 },
      interpolationFactor: 0.3,
      
      // Animation
      animationId: null
    }
  },
  mounted() {
    this.canvas = this.$refs.gameCanvas
    this.ctx = this.canvas.getContext('2d')
    
    // Set canvas size
    this.canvas.width = 800
    this.canvas.height = 500
    
    // Connect socket
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    })
    
    this.setupSocketListeners()
    this.setupKeyboardControls()
    
    // Initial draw
    this.draw()
    
    // Check if joining existing game
    const joinId = this.$route.query.join
    if (joinId) {
      this.joinGame(joinId)
    } else {
      this.createGame()
    }
  },
  beforeUnmount() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.socket) this.socket.disconnect()
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
  },
  methods: {
    setupSocketListeners() {
      this.socket.on('game:created', (data) => {
        this.isWaiting = true
        this.gameStatus = 'Waiting for opponent...'
        console.log('Game created:', data.gameId)
      })
      
      this.socket.on('game:started', (data) => {
        this.gameStarted = true
        this.isWaiting = false
        this.gameStatus = 'Game in progress!'
        this.playerPaddle = data.playerPaddle
        this.opponentName = data.opponentName || 'Opponent'
        this.startGameLoop()
      })
      
      this.socket.on('game:state', (state) => {
        // Store target positions for interpolation (smooth network sync)
        this.targetBall.x = state.ball.x
        this.targetBall.y = state.ball.y
        this.targetPaddle1.y = state.paddle1.y
        this.targetPaddle2.y = state.paddle2.y
        this.playerScore = state.score1
        this.opponentScore = state.score2
      })
      
      this.socket.on('game:ended', (data) => {
        this.gameEnded = true
        this.gameStarted = false
        this.winner = data.winner
        this.gameStatus = 'Game Over'
      })
      
      this.socket.on('spectators:update', (spectators) => {
        this.spectators = spectators
      })
      
      this.socket.on('opponent:disconnected', () => {
        this.gameStatus = 'Opponent disconnected'
        this.isWaiting = true
      })
    },
    
    setupKeyboardControls() {
      this.keyDown = (e) => {
        if (e.key === 'w' || e.key === 'W') this.keys.w = true
        if (e.key === 's' || e.key === 'S') this.keys.s = true
      }
      
      this.keyUp = (e) => {
        if (e.key === 'w' || e.key === 'W') this.keys.w = false
        if (e.key === 's' || e.key === 'S') this.keys.s = false
      }
      
      window.addEventListener('keydown', this.keyDown)
      window.addEventListener('keyup', this.keyUp)
    },
    
    createGame() {
      this.socket.emit('game:create', { type: 'pong' })
    },
    
    joinGame(gameId) {
      this.socket.emit('game:join', { gameId })
    },
    
    startGame() {
      this.socket.emit('game:ready')
    },
    
    restartGame() {
      this.gameEnded = false
      this.playerScore = 0
      this.opponentScore = 0
      this.createGame()
    },
    
    goBack() {
      this.$router.push('/games')
    },
    
    startGameLoop() {
      const loop = () => {
        if (!this.gameStarted) return
        
        this.update()
        this.draw()
        
        // Send paddle position to server
        const myPaddleY = this.playerPaddle === 1 ? this.paddle1.y : this.paddle2.y
        this.socket.emit('game:move', { paddleY: myPaddleY })
        
        this.animationId = requestAnimationFrame(loop)
      }
      loop()
    },
    
    update() {
      // Local paddle movement
      if (this.playerPaddle === 1) {
        if (this.keys.w && this.paddle1.y > 0) this.paddle1.y -= this.paddle1.speed
        if (this.keys.s && this.paddle1.y < this.canvas.height - this.paddle1.height) {
          this.paddle1.y += this.paddle1.speed
        }
      } else {
        if (this.keys.w && this.paddle2.y > 0) this.paddle2.y -= this.paddle2.speed
        if (this.keys.s && this.paddle2.y < this.canvas.height - this.paddle2.height) {
          this.paddle2.y += this.paddle2.speed
        }
      }
      
      // Interpolate towards target positions (smooth network sync)
      this.interpolateGameObjects()
      
      // Ball physics (only calculated on server in real implementation)
      // This is client-side prediction for smooth gameplay
      this.ball.x += this.ball.dx
      this.ball.y += this.ball.dy
      
      // Ball collision with top/bottom
      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
        this.ball.dy = -this.ball.dy
      }
      
      // Ball collision with paddles
      this.checkPaddleCollision(this.paddle1)
      this.checkPaddleCollision(this.paddle2)
    },
    
    checkPaddleCollision(paddle) {
      if (this.ball.x - this.ball.radius < paddle.x + paddle.width &&
          this.ball.x + this.ball.radius > paddle.x &&
          this.ball.y > paddle.y &&
          this.ball.y < paddle.y + paddle.height) {
        this.ball.dx = -this.ball.dx
        // Add some angle based on where it hit the paddle
        const hitPoint = (this.ball.y - paddle.y) / paddle.height
        this.ball.dy = (hitPoint - 0.5) * 10
      }
    },
    
    draw() {
      // Clear canvas
      this.ctx.fillStyle = '#2f3136'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      
      // Draw center line
      this.ctx.strokeStyle = '#40444b'
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([5, 15])
      this.ctx.beginPath()
      this.ctx.moveTo(this.canvas.width / 2, 0)
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height)
      this.ctx.stroke()
      this.ctx.setLineDash([])
      
      // Draw paddles
      this.ctx.fillStyle = '#5865f2'
      this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height)
      this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height)
      
      // Draw ball
      this.ctx.fillStyle = '#fff'
      this.ctx.beginPath()
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2)
      this.ctx.fill()
      
      // Draw player indicators
      this.ctx.fillStyle = '#b9bbbe'
      this.ctx.font = '14px Arial'
      this.ctx.fillText('W/S to move', 20, this.canvas.height - 20)
    }
  }
}
</script>

<style scoped>
.pong-layout {
  min-height: 100vh;
  background: #36393f;
  font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #2f3136;
  border-bottom: 1px solid #202225;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  color: #fff;
  margin: 0;
  font-size: 24px;
}

.btn-back {
  padding: 8px 16px;
  background: #40444b;
  color: #b9bbbe;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background: #4752c4;
  color: #fff;
}

.game-info {
  text-align: center;
>>>>>>> ffac17d9a68243c31599178b01b4878b082c9953
}

.score {
  display: flex;
<<<<<<< HEAD
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

.score {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}

.score .player {
  color: #b9bbbe;
  font-size: 14px;
  min-width: 80px;
}

.score-number {
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  min-width: 40px;
}

.separator {
  color: #72767d;
  font-size: 24px;
}

.status {
  color: #3ba55d;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Game Container */
.game-container {
  display: flex;
  justify-content: center;
  padding: 24px;
  position: relative;
}

.game-canvas {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  max-width: 100%;
  height: auto;
}

/* Game Overlay */
.game-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(47, 49, 54, 0.95);
  border-radius: 16px;
  padding: 40px 60px;
  text-align: center;
  border: 1px solid #40444b;
}

.game-overlay.winner {
  background: rgba(59, 165, 93, 0.95);
  border-color: #3ba55d;
}

.overlay-content h3 {
  color: #fff;
  margin: 0 0 16px 0;
  font-size: 28px;
}

.overlay-content p {
  color: #b9bbbe;
  margin: 0 0 24px 0;
  font-size: 16px;
}

.btn-start {
  padding: 16px 32px;
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.btn-start:hover {
  background: #4752c4;
  transform: scale(1.05);
}

.waiting-animation {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.dot {
  color: #fff;
  font-size: 32px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Controls */
.controls {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.control-section h4,
.spectators h4 {
  color: #fff;
  margin: 0 0 16px 0;
  font-size: 16px;
}

.keys {
  display: flex;
  gap: 24px;
}

.key-group {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #b9bbbe;
  font-size: 14px;
}

.key {
  display: inline-block;
  padding: 8px 16px;
  background: #40444b;
  border-radius: 4px;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid #202225;
}

.spectator-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spectator {
  padding: 4px 12px;
  background: #40444b;
  border-radius: 12px;
  color: #b9bbbe;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .game-info {
    order: -1;
  }
  
  .score-number {
    font-size: 24px;
  }
  
  .game-canvas {
    width: 100%;
    max-width: 400px;
  }
  
  .game-overlay {
    padding: 24px 32px;
    width: 90%;
  }
  
  .overlay-content h3 {
    font-size: 20px;
  }
  
  .controls {
    grid-template-columns: 1fr;
    padding: 16px;
  }
}
</style>
