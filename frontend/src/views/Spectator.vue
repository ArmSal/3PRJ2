<template>
  <div class="spectate-container">
    <!-- Header -->
    <header class="spectate-header glass-card">
      <button @click="goBack" class="btn-back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Games
      </button>
      <div class="match-info">
        <h2>👁️ Spectator Mode</h2>
        <div class="match-players">
          <span class="player">{{ gameData.player1 || 'Player 1' }}</span>
          <span class="vs">VS</span>
          <span class="player">{{ gameData.player2 || 'Waiting...' }}</span>
        </div>
      </div>
      <div class="spectator-count">
        <span class="eye-icon">👁️</span>
        <span>{{ spectatorCount }} watching</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="spectate-content">
      <!-- Game Canvas -->
      <div class="game-view glass-card">
        <canvas ref="gameCanvas" width="800" height="400" class="game-canvas"></canvas>
        
        <!-- Overlay Info -->
        <div class="game-overlay">
          <div class="score-board">
            <div class="score-box">
              <span class="player-name">{{ gameData.player1 || 'Player 1' }}</span>
              <span class="score">{{ gameData.score1 || 0 }}</span>
            </div>
            <div class="timer">{{ gameTime }}</div>
            <div class="score-box">
              <span class="player-name">{{ gameData.player2 || 'Player 2' }}</span>
              <span class="score">{{ gameData.score2 || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Waiting Overlay -->
        <div v-if="!gameData.player2" class="waiting-overlay">
          <div class="waiting-content">
            <div class="loading-spinner"></div>
            <p>Waiting for opponent...</p>
          </div>
        </div>
      </div>

      <!-- Side Panel -->
      <aside class="side-panel">
        <!-- Spectator Chat -->
        <div class="spectator-chat glass-card">
          <div class="chat-header">
            <h3>💬 Spectator Chat</h3>
            <span class="user-count">{{ chatUsers.length }} online</span>
          </div>
          <div class="chat-messages" ref="chatContainer">
            <div 
              v-for="msg in spectatorMessages" 
              :key="msg.id"
              class="chat-message"
            >
              <span class="chat-user">{{ msg.username }}:</span>
              <span class="chat-text">{{ msg.text }}</span>
            </div>
          </div>
          <div class="chat-input">
            <input 
              v-model="newMessage" 
              @keyup.enter="sendChatMessage"
              placeholder="Say something..."
              class="input-modern"
            />
            <button @click="sendChatMessage" class="btn-send">➤</button>
          </div>
        </div>

        <!-- Live Stats -->
        <div class="live-stats glass-card">
          <h3>📊 Match Stats</h3>
          <div class="stat-row">
            <span>Ball Speed</span>
            <div class="stat-bar">
              <div class="stat-fill" :style="{ width: ballSpeed + '%' }"></div>
            </div>
          </div>
          <div class="stat-row">
            <span>Rally Length</span>
            <span class="stat-value">{{ rallyLength }} hits</span>
          </div>
          <div class="stat-row">
            <span>Longest Rally</span>
            <span class="stat-value">{{ longestRally }} hits</span>
          </div>
        </div>

        <!-- Other Matches -->
        <div class="other-matches glass-card">
          <h3>🔥 Other Live Matches</h3>
          <div class="match-list">
            <div 
              v-for="match in otherMatches" 
              :key="match.id"
              class="match-item"
              @click="switchMatch(match.id)"
            >
              <div class="match-preview">
                <div class="mini-game"></div>
              </div>
              <div class="match-details">
                <p>{{ match.player1 }} vs {{ match.player2 }}</p>
                <span>{{ match.spectators }} watching</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  data() {
    return {
      socket: null,
      gameId: this.$route.params.id,
      gameData: {
        player1: '',
        player2: '',
        score1: 0,
        score2: 0,
        ballX: 400,
        ballY: 200,
        paddle1Y: 150,
        paddle2Y: 150
      },
      gameTime: '00:00',
      spectatorCount: 1,
      chatUsers: [],
      spectatorMessages: [],
      newMessage: '',
      ballSpeed: 50,
      rallyLength: 0,
      longestRally: 12,
      otherMatches: [
        { id: 102, player1: 'Alice', player2: 'Bob', spectators: 5 },
        { id: 103, player1: 'ProGamer', player2: 'Noob', spectators: 12 }
      ],
      canvas: null,
      ctx: null
    }
  },
  mounted() {
    this.canvas = this.$refs.gameCanvas
    this.ctx = this.canvas.getContext('2d')
    
    // Initialize socket
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    })
    
    this.socket.emit('spectate:join', this.gameId)
    
    this.socket.on('game:state', (state) => {
      this.gameData = { ...this.gameData, ...state }
      this.drawGame()
    })
    
    this.socket.on('spectator:count', (count) => {
      this.spectatorCount = count
    })
    
    this.socket.on('spectator:message', (msg) => {
      this.spectatorMessages.push(msg)
      this.scrollToBottom()
    })
    
    // Start game loop for smooth rendering
    this.gameLoop()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.emit('spectate:leave', this.gameId)
      this.socket.disconnect()
    }
  },
  methods: {
    drawGame() {
      const { ctx, canvas } = this
      const { width, height } = canvas
      
      // Clear canvas
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, width, height)
      
      // Draw center line
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw paddles
      ctx.fillStyle = '#00d4ff'
      ctx.fillRect(20, this.gameData.paddle1Y, 10, 80)
      
      ctx.fillStyle = '#ff006e'
      ctx.fillRect(width - 30, this.gameData.paddle2Y, 10, 80)
      
      // Draw ball with glow
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(this.gameData.ballX, this.gameData.ballY, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    },
    gameLoop() {
      this.drawGame()
      requestAnimationFrame(this.gameLoop)
    },
    sendChatMessage() {
      if (!this.newMessage.trim()) return
      
      this.socket.emit('spectator:chat', {
        gameId: this.gameId,
        text: this.newMessage,
        username: JSON.parse(localStorage.getItem('user') || '{}').username
      })
      
      this.newMessage = ''
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer
        if (container) container.scrollTop = container.scrollHeight
      })
    },
    switchMatch(matchId) {
      this.$router.push(`/spectate/${matchId}`)
    },
    goBack() {
      this.$router.push('/games')
    }
  }
}
</script>

<style scoped>
.spectate-container {
  min-height: 100vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spectate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.match-info h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.match-players {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.match-players .player {
  font-weight: 600;
}

.match-players .vs {
  color: var(--neon-pink);
  font-weight: 700;
}

.spectator-count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 0, 110, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: 20px;
}

.eye-icon {
  animation: pulse 2s infinite;
}

/* Content */
.spectate-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  flex: 1;
}

.game-view {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
}

.game-canvas {
  width: 100%;
  max-width: 800px;
  height: auto;
  aspect-ratio: 2/1;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.game-overlay {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 24px;
  pointer-events: none;
}

.score-board {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 32px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  min-width: 140px;
}

.score-box:first-child {
  border: 2px solid var(--neon-blue);
}

.score-box:last-child {
  border: 2px solid var(--neon-pink);
}

.player-name {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.score {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
}

.timer {
  font-size: 24px;
  font-weight: 700;
  font-family: monospace;
  color: var(--neon-green);
}

.waiting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
}

.waiting-content {
  text-align: center;
}

.waiting-content p {
  margin-top: 16px;
  color: var(--text-secondary);
}

/* Side Panel */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spectator-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-glass);
}

.chat-header h3 {
  font-size: 14px;
  font-weight: 600;
}

.user-count {
  font-size: 12px;
  color: var(--neon-green);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-message {
  font-size: 13px;
}

.chat-user {
  color: var(--neon-blue);
  font-weight: 600;
  margin-right: 6px;
}

.chat-text {
  color: var(--text-primary);
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border-glass);
}

.chat-input .input-modern {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
}

.btn-send {
  padding: 10px 14px;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}

/* Live Stats */
.live-stats {
  padding: 16px;
}

.live-stats h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
}

.stat-bar {
  width: 100px;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-blue), var(--neon-pink));
  transition: width 0.3s;
}

.stat-value {
  color: var(--neon-green);
  font-weight: 600;
}

/* Other Matches */
.other-matches {
  padding: 16px;
}

.other-matches h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.match-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.match-preview {
  width: 60px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
}

.match-details p {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.match-details span {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 1200px) {
  .spectate-content {
    grid-template-columns: 1fr;
  }
  
  .side-panel {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .spectator-chat {
    flex: 1;
    min-width: 300px;
    min-height: 200px;
  }
  
  .live-stats,
  .other-matches {
    flex: 1;
    min-width: 250px;
  }
}

@media (max-width: 768px) {
  .spectate-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .score-board {
    gap: 12px;
  }
  
  .score-box {
    padding: 12px 20px;
    min-width: auto;
  }
  
  .score {
    font-size: 32px;
  }
  
  .timer {
    font-size: 18px;
  }
}
</style>
