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
      description: 'Global Elimination Protocol',
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
    if (selectedTournament.value?.id === id) await showBrackets(id)
  } catch (e) {
    alert("Neural Link Failed: Link already active or bracket capacity exceeded.")
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
    alert("System Error: Admin authorization required.")
  }
}

onMounted(fetchTournaments)
</script>

<template>
  <div class="h-full p-4 md:p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
      <div>
        <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase mb-2">Elimination Hub</h2>
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Tactical Bracket Protocls</p>
      </div>
      <button @click="showCreateModal = true" class="px-8 py-3 bg-primary hover:bg-primary/80 rounded-2xl text-[10px] font-black italic uppercase tracking-widest transition-all shadow-xl shadow-primary/20">
        NEW PROTOCOL +
      </button>
    </div>

    <!-- Tournament Grid -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>

    <div v-else-if="tournaments.length === 0" class="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/5 rounded-[40px] opacity-40">
       <span class="text-4xl mb-4">🏆</span>
       <p class="text-[10px] font-black uppercase tracking-widest">No active elimination sequences.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="t in tournaments" :key="t.id" class="bg-black/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-xl hover:border-primary/30 transition-all flex flex-col h-full group relative overflow-hidden">
           <div class="flex items-start justify-between mb-6">
              <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                 {{ t.game_type === 'pong' ? '🏓' : (t.game_type === 'snake' ? '🐍' : (t.game_type === 'trivia' ? '❓' : '♟️')) }}
              </div>
              <span :class="cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', t.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')">
                {{ t.status }}
              </span>
           </div>

           <h3 class="text-xl font-black italic uppercase text-white mb-2 truncate">{{ t.name }}</h3>
           <p class="text-[11px] font-bold text-slate-500 mb-8 uppercase leading-relaxed line-clamp-2">Host: {{ t.creator_name }} • Protocol: {{ t.game_type }}</p>

           <!-- Participants Snapshot -->
           <div class="flex flex-col gap-4 mb-8">
              <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-600">
                 <span>Personnel Linked</span>
                 <span class="text-white">{{ t.participant_count }} / {{ t.max_participants }}</span>
              </div>
              <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                 <div class="bg-primary h-full transition-all duration-1000" :style="{ width: `${(t.participant_count / t.max_participants) * 100}%` }"></div>
              </div>
           </div>

           <div class="mt-auto grid grid-cols-2 gap-3">
              <button v-if="t.status === 'pending'" @click="joinTournament(t.id)" class="py-4 bg-primary hover:bg-primary/80 text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest shadow-lg transition-all" :disabled="t.participant_count >= t.max_participants">
                {{ t.participant_count >= t.max_participants ? 'FULL' : 'ENGAGE' }}
              </button>
              <button @click="showBrackets(t.id)" class="py-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all">
                SPECTATE
              </button>
           </div>
      </div>
    </div>

    <!-- Bracket Visualization Overlay -->
    <div v-if="selectedTournament" class="fixed inset-0 bg-[#0b0d14] z-[150] overflow-y-auto p-4 md:p-12 animate-in slide-in-from-bottom duration-500 flex flex-col md:flex-row gap-8">
       
       <!-- Participants Sidebar -->
       <aside class="w-full md:w-80 flex-shrink-0 bg-[#090b11] border border-white/5 rounded-[40px] p-8 flex flex-col overflow-y-auto max-h-[400px] md:max-h-full">
          <div class="mb-8">
             <h4 class="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Neural Signatures</h4>
             <h3 class="text-xl font-black italic text-white uppercase italic tracking-tighter">Personnel List</h3>
          </div>
          
          <div class="space-y-3">
             <div v-for="(p, i) in selectedTournament.participants" :key="p.id" class="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                <div class="relative">
                   <div class="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-slate-500 uppercase italic">{{ (p.username || 'U').charAt(0) }}</div>
                   <div class="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-lg border-4 border-[#0b0d14] flex items-center justify-center text-[8px] font-black italic shadow-xl" v-if="i === 0">H</div>
                </div>
                <div class="flex flex-col min-w-0">
                   <span class="text-xs font-black italic text-white uppercase truncate">{{ p.username }}</span>
                   <span class="text-[8px] font-bold uppercase tracking-widest" :class="i === 0 ? 'text-primary' : 'text-slate-600'">{{ i === 0 ? 'Player 01 (Host)' : `Player ${String(i + 1).padStart(2, '0')}` }}</span>
                </div>
             </div>
             
             <div v-for="empty in Math.max(0, selectedTournament.max_participants - selectedTournament.participants.length)" :key="'empty'+empty" class="p-4 rounded-3xl border border-dashed border-white/5 flex items-center gap-4 opacity-20 grayscale">
                <div class="w-10 h-10 rounded-2xl bg-black/40 border border-white/5"></div>
                <span class="text-[10px] font-black uppercase tracking-widest italic">Awaiting Recruit...</span>
             </div>
          </div>
       </aside>

       <!-- Main Bracket View -->
       <div class="flex-1 flex flex-col">
          <header class="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
             <button @click="selectedTournament = null" class="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">← RETREAT</button>
             <div class="text-center">
               <h2 class="text-4xl font-black italic uppercase italic tracking-tighter text-white">{{ selectedTournament.name }}</h2>
               <p class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{{ selectedTournament.status }} PROTOCOL ACTIVE</p>
             </div>
             <button v-if="selectedTournament.status === 'pending'" @click="startSimulation(selectedTournament.id)" class="px-6 py-3 bg-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all">INITIALIZE BRACKET ⚡</button>
             <div v-else class="w-32"></div>
          </header>

          <div v-if="selectedTournament.matches && selectedTournament.matches.length > 0" class="flex flex-nowrap items-center gap-12 overflow-x-auto py-8">
             <div v-for="roundNum in Math.max(...selectedTournament.matches.map((m: any) => m.round))" :key="roundNum" class="flex-shrink-0 w-64 flex flex-col justify-around gap-8">
                <div class="text-center mb-4">
                   <span class="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Sect.{{ roundNum }}</span>
                   <h4 class="text-[11px] font-black text-white uppercase italic tracking-tighter">{{ roundNum === Math.max(...selectedTournament.matches.map((m: any) => m.round)) ? 'Final Round' : `Round ${roundNum}` }}</h4>
                </div>
                <div v-for="match in selectedTournament.matches.filter((m: any) => m.round === roundNum)" :key="match.id" class="p-5 bg-[#090b11] border border-white/5 rounded-3xl relative group shadow-2xl">
                   <div class="flex items-center justify-between mb-4">
                      <div class="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[7px] font-black text-slate-600 uppercase italic">Comb.{{ match.match_number }}</div>
                      <div v-if="match.winner_id" class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
                   </div>
                   <div class="space-y-2">
                      <div :class="cn('flex items-center justify-between p-3 rounded-2xl text-[10px] font-black uppercase transition-all italic border', match.winner_id === match.player1_id ? 'bg-primary/20 text-white border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/20 text-slate-600 border-white/5')">
                         <span class="truncate">{{ match.player1_name || 'Standby...' }}</span>
                         <span v-if="match.winner_id && match.winner_id === match.player1_id">🥇</span>
                      </div>
                      <div :class="cn('flex items-center justify-between p-3 rounded-2xl text-[10px] font-black uppercase transition-all italic border', match.winner_id === match.player2_id ? 'bg-primary/20 text-white border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/20 text-slate-600 border-white/5')">
                         <span class="truncate">{{ match.player2_name || 'Standby...' }}</span>
                         <span v-if="match.winner_id && match.winner_id === match.player2_id">🥇</span>
                      </div>
                   </div>
                </div>
             </div>
             <!-- Champion Crown -->
             <div class="flex-shrink-0 w-64 flex flex-col items-center justify-center gap-6">
                <div class="w-32 h-32 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(245,158,11,0.1)] group hover:scale-110 transition-transform">
                   <span class="text-6xl drop-shadow-2xl">👑</span>
                </div>
                <div class="text-center">
                   <h5 class="text-lg font-black text-amber-500 uppercase tracking-tighter italic">Neural Victor</h5>
                   <p class="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Protocol Finalized</p>
                </div>
             </div>
          </div>
          <div v-else class="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-40">
             <span class="text-6xl mb-6">👁️‍🗨️</span>
             <p class="text-[12px] font-black uppercase tracking-[0.4em]">Brackets Awaiting Initialization...</p>
          </div>
       </div>
    </div>

    <!-- Create Tournament Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div class="bg-[#0b0d14] border border-white/10 w-full max-w-xl rounded-[48px] p-8 md:p-12 shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)] animate-in zoom-in duration-300">
        <div class="flex items-center gap-4 mb-8">
           <div class="w-12 h-1 alpha">🏆</div>
           <h3 class="text-3xl font-black italic tracking-tighter text-white uppercase italic">Protocol Setup</h3>
        </div>
        
        <div class="space-y-8">
          <div class="space-y-2 text-left">
             <div class="flex items-center justify-between px-2">
                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation Designation</label>
                <span class="text-[10px] font-bold text-primary italic">Required*</span>
             </div>
            <input v-model="newTournament.name" type="text" placeholder="e.g. TITAN_ENGAGEMENT" class="w-full bg-black/60 border border-white/5 rounded-3xl p-5 text-sm font-bold focus:border-primary outline-none uppercase italic tracking-tight" />
          </div>

          <div class="space-y-4 text-left">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Combat Protocol</label>
            <div class="grid grid-cols-4 gap-4">
               <button v-for="game in GAME_TYPES" :key="game.id" @click="newTournament.gameType = game.id" :class="cn('p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 group', newTournament.gameType === game.id ? 'bg-primary border-primary text-white shadow-xl' : 'bg-black/40 border-white/5 text-slate-500 hover:border-primary/20')">
                 <span class="text-2xl group-hover:scale-110 transition-transform">{{ game.icon }}</span>
                 <span class="text-[8px] font-black uppercase italic tracking-tighter">{{ game.id }}</span>
               </button>
            </div>
          </div>

          <div class="space-y-4 text-left">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Unit Capacity (Max Slots)</label>
            <div class="grid grid-cols-3 gap-4">
               <button v-for="size in [8, 16, 32]" :key="size" @click="newTournament.maxParticipants = size" :class="cn('p-5 rounded-3xl border transition-all text-sm font-black italic shadow-inner', newTournament.maxParticipants === size ? 'bg-primary border-primary text-white shadow-xl' : 'bg-black/40 border-white/5 text-slate-500')">
                 {{ size }} UNITS
               </button>
            </div>
          </div>

          <div class="flex flex-col md:flex-row items-center gap-4 pt-6">
            <button @click="showCreateModal = false" class="w-full md:flex-1 p-5 rounded-3xl text-[11px] font-black uppercase text-slate-500 hover:text-white transition-all italic">Abort Protocol</button>
            <button @click="createTournament" :disabled="!newTournament.name" class="w-full md:flex-1 p-5 bg-primary text-white rounded-3xl text-[11px] font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all italic disabled:opacity-30">Execute Setup</button>
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
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
