<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import GameCard from '@/components/GameCard.vue'
import { cn } from '@/lib/utils'

const router = useRouter()
const gameStore = useGameStore()
const activeTab = ref('ALL_ARENAS')

const games = ref([
  { id: 1, name: 'Pong Combat', description: 'Classic high-fidelity paddle warfare. Standard 1v1 protocol.', icon: '🏓', players: 42, status: 'active' as const, statusText: 'LIVE' },
  { id: 2, name: 'Snake Arena', description: 'Survival battle royale. Multi-unit neural growth simulation.', icon: '🐍', players: 12, status: 'active' as const, statusText: 'LIVE' },
  { id: 3, name: 'Trivia Intel', description: 'Knowledge-based cognitive combat. Real-time decryption.', icon: '❓', players: 8, status: 'beta' as const, statusText: 'BETA' },
  { id: 4, name: 'Chess Matrix', description: 'Strategic grandmaster simulation. Zero-latency tactical board.', icon: '♟️', players: 4, status: 'new' as const, statusText: 'NEW' }
])

onMounted(async () => {
  // If fetchActiveGames is missing or renamed, ensure it's called
  // await gameStore.fetchActiveGames() 
})

const getIcon = (type: string) => {
  const icons: Record<string, string> = { pong: '🏓', snake: '🐍', trivia: '❓', chess: '♟️' }
  return icons[type] || '🎮'
}

const launchGame = (gameId: number) => {
  const routes: Record<number, string> = { 1: 'pong', 2: 'snake', 3: 'trivia', 4: 'chess' }
  router.push(`/app/${routes[gameId]}`)
}

const joinGame = (gameId: string) => {
  console.log(`Linking to Arena: ${gameId}`)
  // Assuming a reactive join logic
  router.push(`/app/pong?join=${gameId}`)
}

const spectateGame = (gameId: string) => {
  console.log(`📡 NEURAL SPECTATOR LINK ESTABLISHED: ${gameId}`)
  router.push(`/app/spectate?id=${gameId}`)
}
</script>

<template>
  <div class="h-full p-8 overflow-y-auto custom-scrollbar relative animate-in fade-in duration-700">
    <!-- Hero Highlight -->
    <section class="min-h-[220px] md:h-[320px] rounded-[32px] md:rounded-[40px] mb-8 md:mb-12 relative overflow-hidden group border border-white/5 shadow-2xl shadow-primary/10">
      <div class="absolute inset-0 bg-[#111420]/80 z-10"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-indigo-600/20 z-0"></div>
      
      <div class="absolute inset-0 z-20 p-6 md:p-12 flex items-center justify-between">
         <div class="max-w-md">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">
               🔥 HIGH-INTENSITY ARENA
            </div>
            <h2 class="text-3xl md:text-6xl font-black italic tracking-tighter text-white mb-4 uppercase leading-[0.9]">
               Pong <br /> Championship
            </h2>
            <p class="hidden md:block text-sm font-bold text-slate-400 uppercase tracking-wide leading-relaxed mb-8">
               Master the neural paddle. Neutralize your opponents in high-speed, zero-latency matches.
            </p>
            <button @click="launchGame(1)" class="px-6 md:px-8 py-3 md:py-3.5 bg-primary hover:bg-primary/80 rounded-2xl text-[9px] md:text-[10px] font-black italic uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 flex items-center gap-2">
               START COMBAT <span>⚡</span>
            </button>
         </div>
      </div>
    </section>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
       <div class="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto w-full md:w-auto custom-scrollbar">
          <button 
             v-for="cat in ['ALL_ARENAS', 'CASUAL', 'STRATEGY', 'LIVE']" 
             :key="cat"
             @click="activeTab = cat"
             :class="cn(
               'px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black italic tracking-widest transition-all whitespace-nowrap',
               activeTab === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
             )"
          >
             {{ cat }}
          </button>
       </div>
       
       <div class="flex items-center gap-4 text-slate-600">
          <span class="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] italic">System Latency: 12ms</span>
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
       </div>
    </div>

    <!-- Main Game Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
       <GameCard 
         v-for="game in games"
         :key="game.id"
         v-bind="game"
         @launch="launchGame(game.id)"
       />
    </section>

    <!-- Live Active Lobbies Section -->
    <section v-if="gameStore.availableGames.length > 0" class="animate-in slide-in-from-bottom-6 duration-700">
       <div class="flex items-center justify-between mb-8">
          <h3 class="text-xs font-black italic tracking-widest text-slate-500 uppercase flex items-center gap-4">
             <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
             Direct Tactical Links
          </h3>
          <div class="h-px flex-1 bg-white/5 ml-8"></div>
       </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div 
              v-for="game in gameStore.availableGames" 
              :key="game.gameId"
              class="bg-black/40 p-5 rounded-[28px] border border-white/5 hover:border-primary/40 transition-all flex flex-col gap-4 group"
           >
              <div class="flex items-center justify-between">
                 <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-lg">{{ getIcon(game.gameType) }}</div>
                    <div class="flex flex-col">
                       <h4 class="text-[10px] font-black italic uppercase tracking-tight text-white">{{ game.gameType }} Arena</h4>
                       <span class="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Operation: {{ game.gameId.split('-')[1] }}</span>
                    </div>
                 </div>
                 <div class="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-[8px] font-black text-red-500 uppercase">Live</div>
              </div>

              <!-- Personnel List -->
              <div class="flex flex-wrap gap-2 py-3 border-y border-white/5">
                 <div class="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                    <div class="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[6px] font-bold">{{ game.player1.charAt(0).toUpperCase() }}</div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">{{ game.player1 }}</span>
                 </div>
                 <div v-if="game.player2" class="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                    <div class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[6px] font-bold">{{ game.player2.charAt(0).toUpperCase() }}</div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">{{ game.player2 }}</span>
                 </div>
                 <div v-else class="flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg border border-dashed border-white/10 opacity-30">
                    <span class="text-[8px] font-black uppercase tracking-widest">— WAITING —</span>
                 </div>
              </div>

              <!-- Deployment Controls -->
              <div class="grid grid-cols-2 gap-3 mt-2">
                 <button @click="joinGame(game.gameId)" class="py-2.5 bg-slate-800 hover:bg-primary text-white rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50" :disabled="!!game.player2">
                    {{ game.player2 ? 'FULL' : 'JOIN' }}
                 </button>
                 <button @click="spectateGame(game.gameId)" class="py-2.5 bg-black/40 border border-white/10 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all shadow-inner active:scale-95">
                    SPECTATE
                 </button>
              </div>
           </div>
        </div>
    </section>
  </div>
</template>

<style scoped>
/* Glassmorphism custom scrollbar overrides */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
</style>
