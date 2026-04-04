<script setup lang="ts">
// frontend/src/views/Leaderboard.vue
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const activeGame = ref('pong')
const loading = ref(false)
const rankings = ref<any[]>([])

const games = [
  { key: 'pong', label: 'Pong', icon: '🏓' },
  { key: 'snake', label: 'Snake', icon: '🐍' },
  { key: 'chess', label: 'Chess', icon: '♟️' },
  { key: 'trivia', label: 'Trivia', icon: '🧠' },
  { key: 'ttt', label: 'Tic Tac Toe', icon: '❎' }
]

const fetchLeaderboard = async (gameType: string) => {
  loading.value = true
  try {
    const { data } = await axios.get(`/api/games/leaderboard/${gameType}`)
    rankings.value = data
  } catch (e) {
    rankings.value = []
  }
  loading.value = false
}

onMounted(() => fetchLeaderboard(activeGame.value))
watch(activeGame, (g) => fetchLeaderboard(g))

const getMedal = (idx: number) => {
  if (idx === 0) return '🥇'
  if (idx === 1) return '🥈'
  if (idx === 2) return '🥉'
  return `#${idx + 1}`
}
</script>

<template>
  <div class="h-full w-full p-6 md:p-12 flex flex-col items-center overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
    <div class="w-full max-w-2xl">

      <!-- Header -->
      <div class="mb-10 text-center md:text-left">
        <div class="flex items-center gap-3 mb-2 justify-center md:justify-start">
          <div class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Global Intelligence Rankings</span>
        </div>
        <h2 class="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Leaderboard</h2>
      </div>

      <!-- Game Tabs -->
      <div class="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 mb-10 overflow-x-auto custom-scrollbar">
        <button v-for="g in games" :key="g.key" @click="activeGame = g.key" :class="cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap', activeGame === g.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300')">
          <span>{{ g.icon }}</span> {{ g.label }}
        </button>
      </div>

      <!-- Rankings Table -->
      <div class="glass-blur rounded-[32px] border border-white/5 overflow-hidden">
        <!-- Header -->
        <div class="grid grid-cols-[60px_1fr_100px] md:grid-cols-[80px_1fr_120px] items-center px-6 py-4 border-b border-white/5 bg-black/40">
          <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">Rank</span>
          <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">Operator</span>
          <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest text-right">Score</span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 flex items-center justify-center">
          <div class="flex gap-2"><div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div><div class="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div><div class="w-2 h-2 bg-primary rounded-full animate-bounce delay-300"></div></div>
        </div>

        <!-- Empty -->
        <div v-else-if="rankings.length === 0" class="py-16 flex flex-col items-center text-slate-700 opacity-40">
          <span class="text-4xl mb-4">🏆</span>
          <span class="text-[10px] font-black uppercase tracking-[0.2em]">No rankings recorded yet</span>
        </div>

        <!-- Rows -->
        <div v-else>
          <div v-for="(entry, idx) in rankings" :key="idx" :class="cn('grid grid-cols-[60px_1fr_100px] md:grid-cols-[80px_1fr_120px] items-center px-6 py-4 transition-all border-b border-white/[0.02]', idx < 3 ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]', entry.user_id === userStore.currentUserId ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : '')">
            <!-- Rank -->
            <span :class="cn('text-lg font-black italic', idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-600')">
              {{ getMedal(idx) }}
            </span>

            <!-- Player -->
            <div class="flex items-center gap-3 min-w-0">
              <div v-if="entry.avatar" class="w-9 h-9 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                <img :src="entry.avatar" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0">
                {{ entry.username?.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-black italic uppercase text-white truncate">{{ entry.username }}</span>
                <span v-if="entry.user_id === userStore.currentUserId" class="text-[7px] font-black text-emerald-500 uppercase tracking-widest">You</span>
              </div>
            </div>

            <!-- Score -->
            <div class="text-right">
              <span :class="cn('text-lg font-black italic', idx === 0 ? 'text-primary' : 'text-white')">{{ entry.score }}</span>
              <span class="text-[8px] font-black text-slate-700 uppercase tracking-widest ml-1">pts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>
