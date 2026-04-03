<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const userStore = useUserStore()

const myGameId = ref<string | null>(null)
const gameStarted = ref(false)
const isWaiting = ref(false)
const gameOver = ref(false)
const score1 = ref(0)
const score2 = ref(0)
const currentQuestionIndex = ref(0)
const totalQuestions = ref(0)
const currentQuestion = ref<any>(null)
const p1Answered = ref(false)
const p2Answered = ref(false)
const winner = ref<number | null>(null)
const playerNum = ref(0) // 1 or 2

const hasAnswered = computed(() => {
  return playerNum.value === 1 ? p1Answered.value : p2Answered.value
})

const winnerMessage = computed(() => {
  if (winner.value === null) return "TACTICAL DRAW"
  return winner.value === userStore.currentUserId ? "ARENA VICTORY" : "UNIT TERMINATED"
})

onMounted(() => {
  initSocket()
  const joinId = route.query.join as string
  if (joinId) joinGame(joinId)
})

const initSocket = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket
  if (!socket) return

  socket.on('game-created', (data: { gameId: string }) => {
    myGameId.value = data.gameId
    isWaiting.value = true
    playerNum.value = 1
  })

  socket.on('game-started', (data: { gameId: string }) => {
    gameStarted.value = true
    isWaiting.value = false
    myGameId.value = data.gameId
    if (playerNum.value === 0) playerNum.value = 2
  })

  socket.on('trivia-state', (state: any) => {
    currentQuestion.value = state.question
    score1.value = state.score1
    score2.value = state.score2
    currentQuestionIndex.value = state.currentQuestionIndex
    totalQuestions.value = state.totalQuestions
    p1Answered.value = state.p1Answered
    p2Answered.value = state.p2Answered
  })

  socket.on('game-ended', (data: { winner: number, score1: number, score2: number }) => {
    gameOver.value = true
    winner.value = data.winner
    score1.value = data.score1
    score2.value = data.score2
  })
}

const createGame = () => {
  gameStore.socket?.emit('create-game', { channelId: 1, gameType: 'trivia' })
}

const joinGame = (gameId: string) => {
  gameStore.socket?.emit('join-game', { gameId })
}

const leaveGame = () => router.push('/app/games')

const selectOption = (index: number) => {
  if (myGameId.value) {
    gameStore.socket?.emit('trivia-answer', {
      gameId: myGameId.value,
      answerIndex: index
    })
  }
}

const resetGame = () => {
  gameStarted.value = false
  gameOver.value = false
  isWaiting.value = false
  currentQuestion.value = null
  createGame()
}
</script>

<template>
  <div class="h-full w-full p-10 flex flex-col items-center overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
    
    <!-- HEADER HUD -->
    <div class="w-full max-w-3xl flex justify-between items-end mb-12">
       <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-2">
             <div :class="cn('w-2 h-2 rounded-full animate-ping', gameStarted ? 'bg-emerald-500' : 'bg-amber-500')"></div>
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
               {{ gameStarted ? 'Cognitive Engagement' : 'Standing By' }}
             </span>
          </div>
          <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Trivia Battle</h2>
       </div>

       <div v-if="gameStarted && !gameOver" class="flex items-center gap-10 glass-blur px-8 py-3 rounded-2xl border border-white/5">
          <div class="flex flex-col items-center">
             <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Unit_01</span>
             <span class="text-2xl font-black italic text-white">{{ score1 }}</span>
          </div>
          <div class="text-slate-700 font-bold italic text-xl">VS</div>
          <div class="flex flex-col items-center">
             <span class="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Unit_02</span>
             <span class="text-2xl font-black italic text-white">{{ score2 }}</span>
          </div>
       </div>

       <button v-if="!gameStarted" @click="leaveGame" class="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
         ← HUB
       </button>
    </div>

    <!-- ARENA MODES -->
    <div class="w-full max-w-4xl relative">
      
      <!-- LOBBY -->
      <div v-if="!gameStarted && !isWaiting" class="glass-blur rounded-[40px] p-16 flex flex-col items-center text-center border border-white/5 animate-in zoom-in-95 duration-500">
         <div class="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-5xl mb-8 shadow-2xl shadow-primary/20">
            🧠
         </div>
         <h3 class="text-4xl font-black italic tracking-tighter text-white mb-4 uppercase leading-none">Intelligence Protocol</h3>
         <p class="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-md mb-12">
            Initiate a high-latency intellectual duel. Knowledge is your primary tactical advantage in the neural network.
         </p>
         <button @click="createGame" class="px-12 py-5 bg-primary text-white rounded-2xl font-black italic uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            INITIALIZE ENCOUNTER ⚡
         </button>
      </div>

      <!-- WAITING -->
      <div v-else-if="isWaiting" class="glass-blur rounded-[40px] p-16 flex flex-col items-center text-center border border-white/5">
         <div class="flex gap-3 mb-10">
            <div class="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div class="w-3 h-3 bg-primary rounded-full animate-bounce delay-150"></div>
            <div class="w-3 h-3 bg-primary rounded-full animate-bounce delay-300"></div>
         </div>
         <h3 class="text-2xl font-black italic tracking-tighter text-white mb-2 uppercase">Awaiting Signature...</h3>
         <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Arena ID: #{{ myGameId?.split('-')[0] }}</p>
      </div>

      <!-- ACTIVE GAME -->
      <div v-else-if="!gameOver && currentQuestion" class="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
         <!-- Question Card -->
         <div class="glass-blur rounded-[40px] p-12 border border-white/5 relative overflow-hidden">
            <!-- Progress Bar -->
            <div class="absolute top-0 left-0 h-1.5 bg-primary/20 w-full">
               <div class="h-full bg-primary shadow-[0_0_15px_#3b82f6] transition-all duration-1000" :style="{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }"></div>
            </div>
            
            <div class="mb-12 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
               <span>Transmission Intel: {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
               <span v-if="hasAnswered" class="text-emerald-500 animate-pulse">Signature Locked</span>
            </div>

            <h3 class="text-3xl md:text-4xl font-black text-center text-white leading-tight italic tracking-tight mb-12">
               "{{ currentQuestion.question }}"
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button 
                  v-for="(option, index) in currentQuestion.options" 
                  :key="index"
                  @click="selectOption(index)"
                  :disabled="hasAnswered"
                  :class="cn(
                    'group relative p-6 rounded-2xl border transition-all duration-300 text-left overflow-hidden',
                    hasAnswered ? 'bg-black/20 border-white/5 cursor-not-allowed opacity-50' : 'bg-black/40 border-white/5 hover:border-primary/50 hover:bg-black/60 shadow-lg'
                  )"
               >
                  <div class="flex items-center gap-6 relative z-10">
                     <span class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                        {{ String.fromCharCode(65 + index) }}
                     </span>
                     <span class="text-sm font-bold uppercase tracking-wide group-hover:translate-x-1 transition-transform">
                        {{ option }}
                     </span>
                  </div>
                  <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </button>
            </div>
         </div>

         <!-- Peer Status -->
         <div class="flex justify-center gap-6">
            <div :class="cn('px-6 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-500', p1Answered ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-black/20 border-white/5 text-slate-700')">
               Unit_01: {{ p1Answered ? 'Locked' : 'Calculating' }}
            </div>
            <div :class="cn('px-6 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-500', p2Answered ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-black/20 border-white/5 text-slate-700')">
               Unit_02: {{ p2Answered ? 'Locked' : 'Calculating' }}
            </div>
         </div>
      </div>

      <!-- GAME OVER -->
      <div v-else-if="gameOver" class="glass-blur rounded-[40px] p-16 flex flex-col items-center text-center border border-white/5 animate-in scale-in-95 duration-700">
         <div class="text-7xl mb-8">🏆</div>
         <h2 class="text-6xl font-black italic text-white tracking-tighter mb-4 uppercase leading-none">{{ winnerMessage }}</h2>
         <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-12 italic">Intel Engagement Concluded</p>

         <div class="flex gap-16 mb-16 p-8 rounded-3xl bg-black/20 border border-white/5 shadow-inner">
            <div class="flex flex-col">
               <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Unit_01</span>
               <span class="text-5xl font-black italic text-white">{{ score1 }}</span>
            </div>
            <div class="flex flex-col">
               <span class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Unit_02</span>
               <span class="text-5xl font-black italic text-white">{{ score2 }}</span>
            </div>
         </div>

         <div class="flex gap-4">
            <button @click="resetGame" class="px-10 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-primary/20">
               RE-INITIALIZE ⚡
            </button>
            <button @click="leaveGame" class="px-10 py-4 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all active:scale-95">
               EXIT ARENA
            </button>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Neural Pulse Animations */
.glass-blur {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
