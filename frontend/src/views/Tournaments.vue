<template>
  <div class="tournies-container glass-card">
    <div class="header">
      <button @click="$router.push('/chat')" class="btn-back">⬅ Back to Server</button>
      <h2>🏆 Tournaments Hub</h2>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">Loading tournaments...</div>
      
      <div v-else-if="tournaments.length === 0" class="no-tournies">
        <p>No active tournaments. Create one to get started!</p>
        <button @click="createTournament" class="btn-primary">Create Tournament</button>
      </div>

      <div v-else class="tournies-grid">
        <div v-for="t in tournaments" :key="t.id" class="tourney-card glass-card">
          <div class="tourney-header">
            <h3>{{ t.name }}</h3>
            <span :class="['status-badge', t.status]">{{ t.status }}</span>
          </div>
          <p class="desc">{{ t.description }}</p>
          <div class="meta">
            <span><strong>Game:</strong> {{ t.game_type }}</span>
            <span><strong>Campus:</strong> {{ t.campus1 }} vs {{ t.campus2 }}</span>
            <span><strong>Players:</strong> {{ t.participant_count }} / {{ t.max_participants }}</span>
          </div>
          
          <button v-if="t.status === 'pending'" @click="joinTournament(t.id)" class="btn-join">
            Join Tournament
          </button>
          <button v-if="t.status === 'ongoing'" class="btn-spectate">
            Spectate Matches
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      tournaments: [],
      loading: true
    };
  },
  async mounted() {
    await this.fetchTournaments();
  },
  methods: {
    async fetchTournaments() {
      try {
        const { data } = await axios.get('/api/tournaments');
        this.tournaments = data;
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async createTournament() {
      const name = prompt("Enter tournament name:");
      if (!name) return;
      try {
        await axios.post('/api/tournaments', {
          name, description: 'Inter-campus competition', gameType: 'pong', campus1: 'Paris', campus2: 'Lyon', maxParticipants: 16, startsAt: new Date().toISOString()
        });
        await this.fetchTournaments();
      } catch(e) {
        console.error(e);
      }
    },
    async joinTournament(id) {
       try {
         await axios.post(`/api/tournaments/${id}/join`, { campus: 'Paris' });
         alert("Successfully joined the tournament!");
         await this.fetchTournaments();
       } catch (e) {
         if (e.response && e.response.status === 400) {
           alert("You are already registered or an error occurred.");
         }
       }
    }
  }
};
</script>

<style scoped>
.tournies-container {
  max-width: 1000px;
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
.btn-back:hover { background: rgba(255,255,255,0.1); }
.tournies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.tourney-card {
  padding: 20px;
  background: rgba(20,20,30,0.6);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tourney-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
}
.status-badge.pending { background: var(--warning); color: #000; }
.status-badge.ongoing { background: var(--neon-green); color: #000; }
.status-badge.finished { background: var(--text-secondary); color: #fff; }
.desc { color: var(--text-secondary); font-size: 14px; }
.meta { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.btn-join {
  background: var(--primary); color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer;
  margin-top: auto;
}
.btn-join:hover { background: var(--primary-hover); }
.btn-spectate { background: rgba(0,0,0,0.4); border: 1px solid var(--neon-pink); color: white; padding: 10px; border-radius: 8px; cursor: pointer; margin-top: auto; }
.btn-spectate:hover { background: rgba(255,0,110,0.2); }
</style>
