<template>
  <div class="games-container">
    <!-- Header -->
    <header class="games-header glass-card">
      <div class="header-left">
        <button @click="goBack" class="btn-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Chat
        </button>
        <h1>🎮 Game Lobby</h1>
      </div>
      <div class="header-right">
        <div class="coins-badge">
          <span class="coin-icon">🪙</span>
          <span>{{ userCoins }}</span>
        </div>
        <div class="user-avatar" @click="showMenu = !showMenu">
          {{ user.username?.charAt(0).toUpperCase() }}
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="games-content">
      <!-- Featured Game -->
      <section class="featured-section">
        <div class="featured-card glass-card" @click="playPong">
          <div class="featured-bg"></div>
          <div class="featured-content">
            <div class="featured-badge">🔥 Most Popular</div>
            <h2>Pong Championship</h2>
            <p>Classic multiplayer paddle game. Challenge your friends in real-time!</p>
            <div class="featured-stats">
              <div class="stat">
                <span class="stat-value">{{ activePlayers }}</span>
                <span class="stat-label">Playing Now</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ waitingGames }}</span>
                <span class="stat-label">Waiting</span>
              </div>
            </div>
            <button class="btn-play-featured">
              <span>Play Now</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 3l14 9-14 9V3z"/>
              </svg>
            </button>
          </div>
          <div class="featured-visual">
            <div class="pong-preview">
              <div class="paddle left"></div>
              <div class="ball"></div>
              <div class="paddle right"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Game Grid -->
      <section class="games-grid-section">
        <h3 class="section-title">All Games</h3>
        <div class="games-grid">
          <div 
            v-for="game in games" 
            :key="game.id"
            :class="['game-card', game.status]"
            @click="game.status === 'active' ? launchGame(game) : null"
          >
            <div class="game-image">{{ game.icon }}</div>
            <div class="game-info">
              <h4>{{ game.name }}</h4>
              <p>{{ game.description }}</p>
              <div class="game-meta">
                <span class="players-count">
                  <span class="dot" :class="{ live: game.players > 0 }"></span>
                  {{ game.players }} playing
                </span>
                <span class="game-status-badge">{{ game.statusText }}</span>
              </div>
            </div>
            <div class="game-overlay">
              <button v-if="game.status === 'active'" class="btn-launch">
                Play
              </button>
              <span v-else class="coming-soon-text">Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Active Games & Spectate -->
      <section class="active-games-section" v-if="activeGames.length > 0">
        <div class="section-header">
          <h3 class="section-title">🔴 Live Games</h3>
          <button class="btn-refresh" @click="refreshGames">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
        <div class="active-games-list">
          <div 
            v-for="game in activeGames" 
            :key="game.id"
            class="active-game-card glass-card"
          >
            <div class="game-preview-mini">
              <div class="mini-pong">
                <div class="mini-ball"></div>
              </div>
            </div>
            <div class="active-game-info">
              <h4>Game #{{ game.id }}</h4>
              <p>{{ game.player1 }} vs {{ game.player2 || 'Waiting...' }}</p>
              <div class="game-progress">
                <span class="score">{{ game.score1 }} - {{ game.score2 }}</span>
                <span class="time">{{ game.duration }}</span>
              </div>
            </div>
            <div class="active-game-actions">
              <button 
                v-if="game.status === 'waiting' && !game.isFull"
                @click="joinGame(game.id)"
                class="btn-join-game"
              >
                Join
              </button>
              <button 
                v-else
                @click="spectateGame(game.id)"
                class="btn-spectate"
              >
                👁 Watch
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Leaderboard -->
      <section class="leaderboard-section">
        <h3 class="section-title">🏆 Top Players</h3>
        <div class="leaderboard-card glass-card">
          <div 
            v-for="(player, index) in leaderboard" 
            :key="player.id"
            :class="['leaderboard-item', { top3: index < 3 }]"
          >
            <div class="rank">
              <span v-if="index < 3" class="rank-medal">{{ ['🥇', '🥈', '🥉'][index] }}</span>
              <span v-else class="rank-number">{{ index + 1 }}</span>
            </div>
            <div class="player-info">
              <div class="player-avatar">{{ player.username.charAt(0) }}</div>
              <span class="player-name">{{ player.username }}</span>
            </div>
            <div class="player-score">
              <span class="score-value">{{ player.score.toLocaleString() }}</span>
              <span class="score-label">pts</span>
            </div>
            <div class="player-trend" :class="player.trend">
              {{ player.trend === 'up' ? '📈' : player.trend === 'down' ? '📉' : '➡️' }}
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      userCoins: 1250,
      activePlayers: 42,
      waitingGames: 8,
      showMenu: false,
      games: [
        {
          id: 1,
          name: 'Pong',
          description: 'Classic multiplayer paddle game',
          icon: '🏓',
          players: 42,
          status: 'active',
          statusText: 'Live'
        },
        {
          id: 2,
          name: 'Snake Arena',
          description: 'Multiplayer snake battle royale',
          icon: '🐍',
          players: 0,
          status: 'coming-soon',
          statusText: 'Soon'
        },
        {
          id: 3,
          name: 'Trivia Battle',
          description: 'Test your knowledge',
          icon: '❓',
          players: 0,
          status: 'coming-soon',
          statusText: 'Soon'
        },
        {
          id: 4,
          name: 'Chess Blitz',
          description: 'Fast-paced chess matches',
          icon: '♟️',
          players: 12,
          status: 'beta',
          statusText: 'Beta'
        }
      ],
      activeGames: [
        {
          id: 101,
          player1: 'ProGamer',
          player2: 'NoobMaster',
          score1: 5,
          score2: 3,
          duration: '2:34',
          status: 'playing',
          isFull: true
        },
        {
          id: 102,
          player1: 'Alice',
          player2: null,
          score1: 0,
          score2: 0,
          duration: '0:00',
          status: 'waiting',
          isFull: false
        }
      ],
      leaderboard: [
        { id: 1, username: 'ChampionX', score: 15420, trend: 'up' },
        { id: 2, username: 'ProPlayer', score: 12850, trend: 'same' },
        { id: 3, username: 'GameMaster', score: 11200, trend: 'down' },
        { id: 4, username: 'SpeedRunner', score: 9850, trend: 'up' },
        { id: 5, username: 'CasualGamer', score: 8400, trend: 'same' }
      ]
    }
  },
  async mounted() {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    await this.loadGamesData()
  },
  methods: {
    async loadGamesData() {
      try {
        const { data } = await axios.get('/api/games/active')
        if (data.length) {
          this.activeGames = data
        }
      } catch (e) {
        console.error('Failed to load games:', e)
      }
    },
    launchGame(game) {
      if (game.id === 1) this.playPong()
    },
    playPong() {
      this.$router.push('/games/pong')
    },
    joinGame(gameId) {
      this.$router.push(`/games/pong?join=${gameId}`)
    },
    spectateGame(gameId) {
      this.$router.push(`/spectate/${gameId}`)
    },
    refreshGames() {
      this.loadGamesData()
    },
    goBack() {
      this.$router.push('/chat')
    },
    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.games-container {
  min-height: 100vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.games-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
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

.btn-back:hover {
  background: #4752c4;
  color: #fff;
}

.games-header h1 {
  font-size: 24px;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.coins-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(249, 168, 37, 0.2), rgba(249, 168, 37, 0.1));
  border: 1px solid var(--warning);
  border-radius: 20px;
  font-weight: 600;
}

.coin-icon {
  font-size: 16px;
}

/* Games Content */
.games-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Featured Section */
.featured-section {
  width: 100%;
}

.featured-card {
  display: grid;
  grid-template-columns: 1fr 300px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.featured-card:hover {
  transform: translateY(-4px);
}

.featured-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(255, 0, 110, 0.1));
  z-index: 0;
}

.featured-content {
  position: relative;
  z-index: 1;
}

.featured-badge {
  display: inline-block;
  padding: 6px 12px;
  background: rgba(255, 0, 110, 0.2);
  border: 1px solid var(--neon-pink);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

.featured-content h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.featured-content p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  max-width: 400px;
}

.featured-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--neon-blue);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-play-featured {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--neon-pink), var(--neon-blue));
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-play-featured:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(255, 0, 110, 0.4);
}

.featured-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pong-preview {
  width: 200px;
  height: 120px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.paddle {
  position: absolute;
  width: 8px;
  height: 40px;
  background: var(--neon-blue);
  border-radius: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.paddle.left {
  left: 16px;
  animation: paddleMove 2s ease-in-out infinite;
}

.paddle.right {
  right: 16px;
  animation: paddleMove 2s ease-in-out infinite reverse;
}

.ball {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--neon-pink);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: ballMove 2s linear infinite;
}

@keyframes paddleMove {
  0%, 100% { top: 30%; }
  50% { top: 70%; }
}

@keyframes ballMove {
  0% { left: 20px; top: 50%; }
  25% { left: 50%; top: 20%; }
  50% { left: 180px; top: 50%; }
  75% { left: 50%; top: 80%; }
  100% { left: 20px; top: 50%; }
}

/* Games Grid */
.games-grid-section {
  width: 100%;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.game-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.game-card.active:hover {
  transform: translateY(-4px);
  border-color: var(--neon-blue);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
}

.game-card.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-card.beta {
  border-color: var(--warning);
}

.game-image {
  font-size: 48px;
  margin-bottom: 12px;
}

.game-info h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.game-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.game-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.players-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
}

.dot.live {
  background: var(--neon-green);
  animation: pulse 2s infinite;
}

.game-status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.game-card.active .game-status-badge {
  background: rgba(0, 212, 255, 0.2);
  color: var(--neon-blue);
}

.game-card.coming-soon .game-status-badge {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.game-card.beta .game-status-badge {
  background: rgba(249, 168, 37, 0.2);
  color: var(--warning);
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.game-card:hover .game-overlay {
  opacity: 1;
}

.btn-launch {
  padding: 12px 32px;
  background: var(--neon-blue);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s;
}

.btn-launch:hover {
  transform: scale(1.1);
}

.coming-soon-text {
  color: var(--text-secondary);
  font-weight: 600;
}

/* Active Games */
.active-games-section {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.btn-refresh:hover {
  border-color: var(--neon-blue);
  color: var(--text-primary);
}

.active-games-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.active-game-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  transition: transform 0.3s;
}

.active-game-card:hover {
  transform: translateX(4px);
}

.game-preview-mini {
  width: 80px;
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.mini-pong {
  width: 100%;
  height: 100%;
  position: relative;
}

.mini-ball {
  width: 8px;
  height: 8px;
  background: var(--neon-pink);
  border-radius: 50%;
  position: absolute;
  animation: miniBall 1s linear infinite;
}

@keyframes miniBall {
  0% { left: 10%; top: 50%; }
  50% { left: 90%; top: 30%; }
  100% { left: 10%; top: 50%; }
}

.active-game-info {
  flex: 1;
}

.active-game-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.active-game-info p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.game-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score {
  font-size: 18px;
  font-weight: 700;
  color: var(--neon-blue);
}

.time {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.active-game-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-join-game {
  padding: 10px 20px;
  background: var(--neon-green);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.3s;
}

.btn-join-game:hover {
  transform: scale(1.05);
}

.btn-spectate {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--neon-blue);
  border-radius: 8px;
  color: var(--neon-blue);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-spectate:hover {
  background: var(--neon-blue);
  color: #000;
}

/* Leaderboard */
.leaderboard-section {
  width: 100%;
}

.leaderboard-card {
  padding: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  transition: background 0.3s;
}

.leaderboard-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.leaderboard-item.top3 {
  background: rgba(255, 215, 0, 0.05);
}

.rank {
  width: 40px;
  text-align: center;
}

.rank-medal {
  font-size: 24px;
}

.rank-number {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--neon-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.player-name {
  font-weight: 600;
}

.player-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--neon-blue);
}

.score-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.player-trend {
  font-size: 16px;
}

.player-trend.up {
  color: var(--neon-green);
}

.player-trend.down {
  color: var(--danger);
}

/* Responsive */
@media (max-width: 1024px) {
  .featured-card {
    grid-template-columns: 1fr;
  }
  
  .featured-visual {
    display: none;
  }
  
  .active-games-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .games-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .featured-stats {
    gap: 16px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>
