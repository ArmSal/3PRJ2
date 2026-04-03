<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'

const userStore = useUserStore()
const tournaments = ref<any[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const selectedTournament = ref<any>(null)

const GAME_TYPES = [
  { id: 'pong', name: 'Pong Combat', icon: '🏓' },
  { id: 'snake', name: 'Snake Arena', icon: '🐍' },
  { id: 'trivia', name: 'Cognitive Intel', icon: '❓' },
  { id: 'chess', name: 'Logic Matrix', icon: '♟️' }
]

const newTournament = ref({
  name: '',
  maxParticipants: 16,
  gameType: 'pong'
})

const fetchTournaments = async () => {
  try {
    const { data } = await axios.get('/api/tournaments')
    tournaments.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const createTournament = async () => {
  try {
    await axios.post('/api/tournaments', {
      ...newTournament.value,
      description: 'Tactical Elimination Protocol',
      campus1: 'Paris-Nexus',
      campus2: 'Lyon-Matrix',
      startsAt: new Date().toISOString()
    })
    showCreateModal.value = false
    await fetchTournaments()
  } catch (e) {
    console.error(e)
  }
}

const joinTournament = async (id: number) => {
  try {
    await axios.post(`/api/tournaments/${id}/join`, { campus: 'Paris-Nexus' })
    await fetchTournaments()
  } catch (e) {
    alert("Neural Link Failed: Bracket full or already registered.")
  }
}

const showBrackets = async (id: number) => {
  try {
    const { data } = await axios.get(`/api/tournaments/${id}`)
    selectedTournament.value = data
  } catch (e) {
    console.error(e)
  }
}

const startSimulation = async (id: number) => {
  try {
    await axios.post(`/api/tournaments/${id}/start`)
    await fetchTournaments()
    await showBrackets(id)
  } catch (e) {
    alert("System Error: Permission Denied.")
  }
}

onMounted(fetchTournaments)
</script>

<template>
  <div class="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
      <div>
        <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase mb-2">Global Brackets</h2>
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Elimination Protocols</p>
      </div>
      <button @click="showCreateModal = true" class="px-8 py-3 bg-primary hover:bg-primary/80 rounded-2xl text-[10px] font-black italic uppercase tracking-widest transition-all shadow-xl shadow-primary/20">
        INITIALIZE TOURNAMENT +
      </button>
    </div>

    <!-- Tournament Grid -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>

    <div v-else-if="tournaments.length === 0" class="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/5 rounded-[40px] opacity-40">
       <span class="text-4xl mb-4">🏆</span>
       <p class="text-[10px] font-black uppercase tracking-widest">No active protocols detected.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="t in tournaments" :key="t.id" class="bg-black/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl hover:border-primary/30 transition-all flex flex-col h-full group relative">
           <div class="flex items-start justify-between mb-6">
              <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                 {{ t.game_type === 'pong' ? '🏓' : (t.game_type === 'snake' ? '🐍' : (t.game_type === 'trivia' ? '❓' : '♟️')) }}
              </div>
              <span :class="cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')">
                {{ t.status }}
              </span>
           </div>

           <h3 class="text-xl font-black italic uppercase text-white mb-2 truncate">{{ t.name }}</h3>
           <p class="text-[11px] font-bold text-slate-500 mb-8 uppercase leading-relaxed">{{ t.description }}</p>

           <!-- Participants Snapshot -->
           <div class="flex flex-wrap gap-1 mb-6 h-6 overflow-hidden">
              <div v-for="p in Math.min(t.participant_count, 3)" :key="p" class="w-5 h-5 rounded-full bg-indigo-600 border border-white/10 flex items-center justify-center text-[7px] font-black -ml-2 first:ml-0 shadow-lg"></div>
              <span class="text-[8px] font-bold text-slate-600 ml-2 uppercase tracking-tighter">{{ t.participant_count }} Linked Personnel</span>
           </div>

           <div class="mt-auto space-y-4">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-600">
                 <span>Participants</span>
                 <span class="text-white">{{ t.participant_count }} / {{ t.max_participants }}</span>
              </div>
              <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                 <div class="bg-primary h-full transition-all duration-1000" :style="{ width: `${(t.participant_count / t.max_participants) * 100}%` }"></div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button v-if="t.status === 'pending'" @click="joinTournament(t.id)" class="py-3 bg-primary hover:bg-primary/80 text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest shadow-lg transition-all" :disabled="t.participant_count >= t.max_participants">
                  {{ t.participant_count >= t.max_participants ? 'FULL' : 'JOIN' }}
                </button>
                <button @click="showBrackets(t.id)" class="py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all">
                  SPECTATE
                </button>
              </div>
           </div>
      </div>
    </div>

    <!-- Bracket Visualization Overlay -->
    <div v-if="selectedTournament" class="fixed inset-0 bg-[#0b0d14] z-[150] overflow-y-auto p-4 md:p-12 animate-in slide-in-from-bottom duration-500">
       <header class="flex items-center justify-between mb-12">
          <button @click="selectedTournament = null" class="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">← CLOSE</button>
          <div class="text-center">
            <h2 class="text-3xl font-black italic uppercase italic tracking-tighter text-white">{{ selectedTournament.name }}</h2>
            <p class="text-[9px] font-black text-primary uppercase tracking-[0.4em]">{{ selectedTournament.status }} PROTOCOL ACTIVE</p>
          </div>
          <button v-if="selectedTournament.status === 'pending'" @click="startSimulation(selectedTournament.id)" class="px-6 py-2 bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">START EXECUTION ⚡</button>
          <div v-else class="w-32"></div>
       </header>

       <div v-if="selectedTournament.matches && selectedTournament.matches.length > 0" class="flex flex-nowrap items-center gap-12 overflow-x-auto py-8">
          <div v-for="roundNum in Math.max(...selectedTournament.matches.map((m: any) => m.round))" :key="roundNum" class="flex-shrink-0 w-64 flex flex-col justify-around gap-8">
             <div class="text-center mb-4">
                <span class="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Section.0{{ roundNum }}</span>
                <h4 class="text-[11px] font-black text-white uppercase italic">{{ roundNum === Math.max(...selectedTournament.matches.map((m: any) => m.round)) ? 'Final Round' : `Round ${roundNum}` }}</h4>
             </div>
             <div v-for="match in selectedTournament.matches.filter((m: any) => m.round === roundNum)" :key="match.id" class="p-5 bg-slate-900/50 border border-white/5 rounded-3xl relative group">
                <div class="flex items-center justify-between mb-4">
                   <div class="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[7px] font-black text-slate-500 uppercase">Match.{{ match.match_number }}</div>
                   <div v-if="match.winner_id" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                </div>
                <div class="space-y-1.5">
                   <div :class="cn('flex items-center justify-between p-2.5 rounded-xl text-[10px] font-black uppercase transition-all', match.winner_id === match.player1_id ? 'bg-primary/20 text-white border border-primary/20 shadow-lg' : 'bg-black/20 text-slate-500 border border-white/5')">
                      <span class="truncate">{{ match.player1_name || 'Standby...' }}</span>
                      <span v-if="match.winner_id && match.winner_id === match.player1_id">🏆</span>
                   </div>
                   <div :class="cn('flex items-center justify-between p-2.5 rounded-xl text-[10px] font-black uppercase transition-all', match.winner_id === match.player2_id ? 'bg-primary/20 text-white border border-primary/20 shadow-lg' : 'bg-black/20 text-slate-500 border border-white/5')">
                      <span class="truncate">{{ match.player2_name || 'Standby...' }}</span>
                      <span v-if="match.winner_id && match.winner_id === match.player2_id">🏆</span>
                   </div>
                </div>
             </div>
          </div>
          <!-- Champion Crown -->
          <div class="flex-shrink-0 w-64 flex flex-col items-center justify-center gap-4">
             <div class="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-2xl">
                <span class="text-4xl">👑</span>
             </div>
             <div class="text-center">
                <h5 class="text-sm font-black text-amber-500 uppercase tracking-widest">Neural Champion</h5>
                <p class="text-[8px] font-bold text-slate-600 uppercase">Grand Victor Awaiting Protocol</p>
             </div>
          </div>
       </div>
    </div>

    <!-- Create Tournament Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div class="bg-[#0b0d14] border border-white/10 w-full max-w-lg rounded-[40px] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300">
        <h3 class="text-3xl font-black italic tracking-tighter text-white uppercase mb-8">Initialize Protocol</h3>
        
        <div class="space-y-6">
          <div class="space-y-2 text-left">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Operation Code Name</label>
            <input v-model="newTournament.name" type="text" placeholder="ALPHA_STRIKE" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none" />
          </div>

          <div class="space-y-3 text-left">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Protocol</label>
            <div class="grid grid-cols-4 gap-3">
               <button v-for="game in GAME_TYPES" :key="game.id" @click="newTournament.gameType = game.id" :class="cn('p-3 rounded-2xl border transition-all flex flex-col items-center', newTournament.gameType === game.id ? 'bg-primary border-primary text-white' : 'bg-black/20 border-white/5 text-slate-500')">
                 <span class="text-xl mb-1">{{ game.icon }}</span>
                 <span class="text-[7px] font-black uppercase truncate">{{ game.id }}</span>
               </button>
            </div>
          </div>

          <div class="space-y-2 text-left">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Units (Players)</label>
            <div class="grid grid-cols-3 gap-4">
               <button v-for="size in [8, 16, 32]" :key="size" @click="newTournament.maxParticipants = size" :class="cn('p-4 rounded-2xl border transition-all text-xs font-black italic', newTournament.maxParticipants === size ? 'bg-primary border-primary text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500')">
                 {{ size }}
               </button>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-6">
            <button @click="showCreateModal = false" class="flex-1 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Abort</button>
            <button @click="createTournament" class="flex-1 p-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase shadow-xl">Execute</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>
