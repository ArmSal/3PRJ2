<template>
  <div class="pong-container">
    <h1>Pong</h1>
    <div class="score">
      <span class="player1">Joueur 1: {{ score1 }}</span>
      <span class="player2">Joueur 2: {{ score2 }}</span>
    </div>
    <canvas ref="pongCanvas" width="800" height="400"></canvas>
    <div class="controls">
      <div class="control-group">
        <span>Joueur 1: <strong>W / S</strong></span>
      </div>
      <div class="control-group">
        <span>Joueur 2: <strong>↑ / ↓</strong></span>
      </div>
    </div>
    <button @click="resetGame" class="reset-btn">Réinitialiser</button>
  </div>
</template>

<script>
export default {
  name: 'Pong',
  data() {
    return {
      canvas: null,
      ctx: null,
      animationId: null,
      score1: 0,
      score2: 0,
      keys: {},
      ball: {
        x: 400,
        y: 200,
        dx: 5,
        dy: 5,
        radius: 10,
        speed: 5
      },
      paddle1: {
        x: 20,
        y: 150,
        width: 10,
        height: 100,
        speed: 8
      },
      paddle2: {
        x: 770,
        y: 150,
        width: 10,
        height: 100,
        speed: 8
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.pongCanvas
    this.ctx = this.canvas.getContext('2d')
    
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    
    this.gameLoop()
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    cancelAnimationFrame(this.animationId)
  },
  methods: {
    handleKeyDown(e) {
      this.keys[e.key] = true
    },
    handleKeyUp(e) {
      this.keys[e.key] = false
    },
    update() {
      // Paddle 1 movement (W/S)
      if (this.keys['w'] || this.keys['W']) {
        this.paddle1.y -= this.paddle1.speed
      }
      if (this.keys['s'] || this.keys['S']) {
        this.paddle1.y += this.paddle1.speed
      }
      
      // Paddle 2 movement (Arrow keys)
      if (this.keys['ArrowUp']) {
        this.paddle2.y -= this.paddle2.speed
      }
      if (this.keys['ArrowDown']) {
        this.paddle2.y += this.paddle2.speed
      }
      
      // Keep paddles within canvas
      this.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y))
      this.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y))
      
      // Ball movement
      this.ball.x += this.ball.dx
      this.ball.y += this.ball.dy
      
      // Ball collision with top/bottom walls
      if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
        this.ball.dy = -this.ball.dy
      }
      
      // Ball collision with paddle 1
      if (
        this.ball.x - this.ball.radius < this.paddle1.x + this.paddle1.width &&
        this.ball.y > this.paddle1.y &&
        this.ball.y < this.paddle1.y + this.paddle1.height &&
        this.ball.dx < 0
      ) {
        this.ball.dx = -this.ball.dx
        // Add slight angle change based on hit position
        const hitPos = (this.ball.y - this.paddle1.y) / this.paddle1.height - 0.5
        this.ball.dy = hitPos * 10
      }
      
      // Ball collision with paddle 2
      if (
        this.ball.x + this.ball.radius > this.paddle2.x &&
        this.ball.y > this.paddle2.y &&
        this.ball.y < this.paddle2.y + this.paddle2.height &&
        this.ball.dx > 0
      ) {
        this.ball.dx = -this.ball.dx
        // Add slight angle change based on hit position
        const hitPos = (this.ball.y - this.paddle2.y) / this.paddle2.height - 0.5
        this.ball.dy = hitPos * 10
      }
      
      // Score when ball goes out
      if (this.ball.x < 0) {
        this.score2++
        this.resetBall()
      }
      if (this.ball.x > this.canvas.width) {
        this.score1++
        this.resetBall()
      }
    },
    resetBall() {
      this.ball.x = 400
      this.ball.y = 200
      this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.speed
      this.ball.dy = (Math.random() * 2 - 1) * this.ball.speed
    },
    resetGame() {
      this.score1 = 0
      this.score2 = 0
      this.paddle1.y = 150
      this.paddle2.y = 150
      this.resetBall()
    },
    draw() {
      // Clear canvas
      this.ctx.fillStyle = '#16213e'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      
      // Draw center line
      this.ctx.strokeStyle = '#444'
      this.ctx.setLineDash([10, 10])
      this.ctx.beginPath()
      this.ctx.moveTo(this.canvas.width / 2, 0)
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height)
      this.ctx.stroke()
      this.ctx.setLineDash([])
      
      // Draw paddle 1
      this.ctx.fillStyle = '#e94560'
      this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height)
      
      // Draw paddle 2
      this.ctx.fillStyle = '#0f3460'
      this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height)
      
      // Draw ball
      this.ctx.beginPath()
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2)
      this.ctx.fillStyle = '#fff'
      this.ctx.fill()
      this.ctx.closePath()
    },
    gameLoop() {
      this.update()
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
  margin-bottom: 10px;
  color: #fff;
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
  display: flex;
  gap: 40px;
  margin-top: 20px;
  padding: 15px 30px;
  background: #16213e;
  border-radius: 8px;
}

.control-group span {
  color: #aaa;
}

.control-group strong {
  color: #fff;
}

.reset-btn {
  margin-top: 20px;
  background: #e94560;
  color: #fff;
  font-size: 16px;
  transition: background 0.3s;
}

.reset-btn:hover {
  background: #ff6b6b;
}
</style>
