<template>
  <div class="games-layout">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <button @click="goBack" class="btn-back">← Back to Chat</button>
        <h2>🎮 Games Lobby</h2>
      </div>
      <div class="header-right">
        <span class="user-info">{{ user?.username }}</span>
        <button @click="logout" class="btn-logout">Logout</button>
      </div>
    </div>

    <!-- Games Grid -->
    <div class="games-container">
      <!-- Pong Card -->
      <div class="game-card" @click="playPong">
        <div class="game-icon">🏓</div>
        <h3>Pong</h3>
        <p>Classic multiplayer paddle game</p>
        <div class="game-stats">
          <span class="players">👥 {{ pongPlayers }} playing</span>
        </div>
        <button class="btn-play">Play Now</button>
      </div>

      <!-- Snake Card -->
      <div class="game-card coming-soon">
        <div class="game-icon">🐍</div>
        <h3>Snake</h3>
        <p>Coming soon...</p>
        <div class="game-stats">
          <span class="players">👥 0 playing</span>
        </div>
        <button class="btn-play" disabled>Soon</button>
      </div>

      <!-- Trivia Card -->
      <div class="game-card coming-soon">
        <div class="game-icon">❓</div>
        <h3>Trivia</h3>
        <p>Coming soon...</p>
        <div class="game-stats">
          <span class="players">👥 0 playing</span>
        </div>
        <button class="btn-play" disabled>Soon</button>
      </div>
    </div>

    <!-- Active Games Section -->
    <div v-if="activeGames.length > 0" class="active-games">
      <h3>🔥 Active Games</h3>
      <div class="games-list">
        <div v-for="game in activeGames" :key="game.id" class="active-game-item">
          <span class="game-name">{{ game.name }}</span>
          <span class="players">{{ game.playerCount }}/2 players</span>
          <button @click="joinGame(game.id)" class="btn-join">Join</button>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="leaderboard">
      <h3>🏆 Leaderboard</h3>
      <div class="leaderboard-list">
        <div v-for="(player, index) in leaderboard" :key="player.id" class="leaderboard-item">
          <span class="rank">{{ index + 1 }}</span>
          <span class="name">{{ player.username }}</span>
          <span class="score">{{ player.score }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      pongPlayers: 0,
      activeGames: [],
      leaderboard: [
        { id: 1, username: 'Player1', score: 1500 },
        { id: 2, username: 'Player2', score: 1200 },
        { id: 3, username: 'Player3', score: 900 },
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
        // Load active games
        const { data } = await axios.get('/api/games/active')
        this.activeGames = data
        this.pongPlayers = data.filter(g => g.type === 'pong').reduce((acc, g) => acc + g.playerCount, 0)
      } catch (e) {
        console.error('Failed to load games:', e)
      }
    },
    playPong() {
      this.$router.push('/games/pong')
    },
    joinGame(gameId) {
      this.$router.push(`/games/pong?join=${gameId}`)
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
.games-layout {
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
  font-size: 20px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  color: #b9bbbe;
  font-size: 14px;
}

.btn-logout {
  padding: 8px 16px;
  background: #ed4245;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-logout:hover {
  background: #c03537;
}

/* Games Container */
.games-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.game-card {
  background: #2f3136;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #40444b;
}

.game-card:hover:not(.coming-soon) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  border-color: #5865f2;
}

.game-card.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.game-card h3 {
  color: #fff;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.game-card p {
  color: #b9bbbe;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.game-stats {
  margin-bottom: 16px;
}

.game-stats .players {
  color: #3ba55d;
  font-size: 14px;
}

.btn-play {
  width: 100%;
  padding: 12px 24px;
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-play:hover:not(:disabled) {
  background: #4752c4;
}

.btn-play:disabled {
  background: #40444b;
  color: #72767d;
  cursor: not-allowed;
}

/* Active Games */
.active-games {
  max-width: 1200px;
  margin: 0 auto 24px;
  padding: 0 24px;
}

.active-games h3 {
  color: #fff;
  margin-bottom: 16px;
  font-size: 18px;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.active-game-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2f3136;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #40444b;
}

.game-name {
  color: #fff;
  font-weight: 500;
}

.active-game-item .players {
  color: #b9bbbe;
  font-size: 14px;
}

.btn-join {
  padding: 8px 16px;
  background: #3ba55d;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-join:hover {
  background: #2d7d46;
}

/* Leaderboard */
.leaderboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 24px;
}

.leaderboard h3 {
  color: #fff;
  margin-bottom: 16px;
  font-size: 18px;
}

.leaderboard-list {
  background: #2f3136;
  border-radius: 8px;
  border: 1px solid #40444b;
  overflow: hidden;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #40444b;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.leaderboard-item .rank {
  width: 30px;
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
}

.leaderboard-item .name {
  flex: 1;
  color: #fff;
  font-size: 14px;
}

.leaderboard-item .score {
  color: #3ba55d;
  font-weight: 600;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .games-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
  
  .header-left h2 {
    font-size: 18px;
  }
  
  .game-card {
    padding: 16px;
  }
  
  .game-icon {
    font-size: 48px;
  }
}
</style>
