<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useVoiceStore } from '@/stores/voice'
import { cn } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()
const userStore = useUserStore()
const chatStore = useChatStore()
const voiceStore = useVoiceStore()

const myGameId = ref<string | null>(null)
const inGame = ref(false)
const isWaiting = ref(false)
const gameOver = ref(false)
const score1 = ref(0)
const score2 = ref(0)
const player1Name = ref('Operator_1')
const player2Name = ref('Operator_2')
const currentQuestion = ref<any>(null)
const currentQuestionIndex = ref(0)
const totalQuestions = ref(0)
const p1Answered = ref(false)
const p2Answered = ref(false)
const countdown = ref(5)
const roundWinner = ref<number | null>(null)
const showChatPopup = ref(false)

// Toast & Volatile Chat state
const gameToasts = ref<{ id: number, content: string, username: string, opacity: number }[]>([])
const volatileMessages = ref<{ id: number, content: string, username: string }[]>([])
let toastCounter = 0

onMounted(() => { initSocket(); const joinId = route.query.join as string; if (joinId) joinGame({ gameId: joinId, player1Id: 0, player1: 'Searching...' }) })

watch(() => chatStore.messages, (newMsgs) => {
  if (inGame.value && newMsgs.length > 0) {
    const lastMsg = newMsgs[newMsgs.length - 1]
    addVolatileMessage(lastMsg.username, lastMsg.content)
  }
}, { deep: true })

const addVolatileMessage = (username: string, content: string) => {
  const id = toastCounter++
  gameToasts.value.push({ id, content, username, opacity: 1 })
  volatileMessages.value.push({ id, content, username })
  setTimeout(() => {
    const interval = setInterval(() => {
      const t = gameToasts.value.find(x => x.id === id)
      if (t) { t.opacity -= 0.1; if (t.opacity <= 0) { gameToasts.value = gameToasts.value.filter(x => x.id !== id); clearInterval(interval) } }
      else clearInterval(interval)
    }, 100)
  }, 2000)
  setTimeout(() => { volatileMessages.value = volatileMessages.value.filter(m => m.id !== id) }, 1000)
}

const initSocket = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket
  if (!socket) return
  socket.on('game-created', (data: { gameId: string }) => { myGameId.value = data.gameId; isWaiting.value = true })
  socket.on('game-started', (data: any) => { inGame.value = true; isWaiting.value = false; myGameId.value = data.gameId; player1Name.value = data.player1Name; player2Name.value = data.player2Name })
  socket.on('trivia-state', (state: any) => {
    currentQuestion.value = state.question; score1.value = state.score1; score2.value = state.score2
    currentQuestionIndex.value = state.currentQuestionIndex; totalQuestions.value = state.totalQuestions
    p1Answered.value = state.p1Answered; p2Answered.value = state.p2Answered
    countdown.value = state.countdown; roundWinner.value = state.roundWinner
  })
  socket.on('game-ended', (data: any) => { gameOver.value = true; score1.value = data.score1; score2.value = data.score2 })
}

const createGame = () => { if (!chatStore.selectedChannel) return; gameStore.socket?.emit('create-game', { channelId: chatStore.selectedChannel.id, gameType: 'trivia' }) }

const joinGame = (game: any) => { gameStore.socket?.emit('join-game', { gameId: game.gameId, player1Id: game.player1Id, player1: game.player1 || game.player1Name, gameType: 'trivia' }) }

const selectOption = (index: number) => { if (myGameId.value) gameStore.socket?.emit('trivia-answer', { gameId: myGameId.value, answerIndex: index }) }

const toggleVoice = async () => {
  if (voiceStore.isInVoice) voiceStore.leaveVoice(gameStore.socket)
  else if (chatStore.selectedChannel) await voiceStore.joinVoice(chatStore.selectedChannel.id, gameStore.socket)
}

const sendQuickMessage = (content: string) => {
  if (!chatStore.selectedChannel || !content.trim()) return
  gameStore.socket?.emit('send-message', { channelId: chatStore.selectedChannel.id, content, userId: userStore.currentUserId, username: userStore.user?.username || 'Unknown', token: userStore.token })
}

const leaveGame = () => { inGame.value = false; isWaiting.value = false; gameOver.value = false; myGameId.value = null }
</script>

<template>
  <div class="h-full w-full p-4 md:p-10 flex flex-col items-center overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 duration-500 selection:bg-primary/20">
    <!-- HUD -->
    <div class="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 gap-6 text-center md:text-left">
       <div class="flex flex-col items-center md:items-start">
          <div class="flex items-center gap-3 mb-2"><div :class="cn('w-2 h-2 rounded-full animate-ping', inGame ? 'bg-emerald-500' : 'bg-amber-500')"></div><span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{{ inGame ? 'Cognitive Combat' : 'Idle Intel' }}</span></div>
          <h2 class="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none italic">Trivia Arena</h2>
       </div>
       <div v-if="inGame" class="flex items-center gap-6 md:gap-10 glass-blur px-6 md:px-10 py-3 md:py-4 rounded-2xl border border-white/5 shadow-2xl">
          <div class="flex flex-col items-center"><span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">{{ player1Name }}</span><span class="text-2xl md:text-3xl font-black italic text-white">{{ score1 }}</span></div>
          <div class="text-slate-700 font-bold italic text-xl md:text-2xl">VS</div>
          <div class="flex flex-col items-center"><span class="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">{{ player2Name }}</span><span class="text-2xl md:text-3xl font-black italic text-white">{{ score2 }}</span></div>
       </div>
    </div>
    
    <!-- Arena Content -->
    <div v-if="!inGame" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div v-if="!isWaiting" class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col justify-between min-h-[280px]">
        <h3 class="text-xl font-black italic uppercase text-white mb-4">Initialize Intelligence Battle</h3>
        <button @click="createGame" class="px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs">INITIALIZE⚡</button>
      </div>
      <div v-else class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-center">Broadcasting...</div>
      <div class="glass-blur p-8 rounded-[32px] border border-white/5 overflow-y-auto max-h-[400px]">
        <h3 class="text-xl font-black uppercase text-white mb-6 italic">Active Decryptions</h3>
        <div v-for="game in gameStore.availableGames.filter((g: any) => g.gameType === 'trivia')" :key="game.gameId" class="mb-4">
           <button @click="joinGame(game)" class="w-full p-4 bg-slate-900/50 rounded-2xl flex justify-between items-center hover:bg-slate-800 transition-all">
              <span class="text-white font-black italic uppercase text-xs">{{ game.player1 }}</span>
              <span class="text-[10px] font-black uppercase text-emerald-500">CHALLENGE</span>
           </button>
        </div>
      </div>
    </div>

    <div v-else class="relative w-full max-w-2xl flex flex-col items-center">
       <div class="relative w-full bg-black rounded-[40px] p-8 md:p-12 border-4 border-slate-900 shadow-2xl min-h-[400px] flex flex-col justify-center">
          <div v-if="currentQuestion" class="space-y-6">
             <div class="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center italic">Transmission {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</div>
             
             <!-- Flash Reaction HUD -->
             <div v-if="roundWinner" class="flex justify-center mb-4">
                <span :class="cn('px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic', Number(roundWinner) === Number(userStore.currentUserId) ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white')">
                   {{ Number(roundWinner) === Number(userStore.currentUserId) ? '⚡ High-Priority Capture Success' : '⚠️ Intelligence Intercepted' }}
                </span>
             </div>

             <h3 class="text-2xl font-black italic text-white text-center mb-8 leading-tight">"{{ currentQuestion.question }}"</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button v-for="(opt, idx) in currentQuestion.options" :key="idx" @click="selectOption(idx)" class="p-5 rounded-2xl bg-slate-900/40 border border-white/5 text-left hover:border-primary transition-all text-xs font-bold uppercase italic tracking-wide flex items-center gap-4 group">
                    <span class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black">{{ String.fromCharCode(65 + idx) }}</span>
                    {{ opt }}
                </button>
             </div>
          </div>

          <!-- Synchronization Overlay -->
          <div v-if="countdown > 0" class="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center rounded-[36px] z-50">
             <span class="text-9xl font-black italic text-primary animate-pulse">{{ countdown }}</span>
          </div>

          <!-- Victory Protocol -->
          <div v-if="gameOver" class="absolute inset-0 bg-black backdrop-blur-md flex flex-col items-center justify-center p-8 rounded-[36px] z-[60]">
             <div class="text-6xl mb-6">👑</div>
             <h3 class="text-4xl font-black italic text-white uppercase text-center mb-4">Intel Sovereign<br/><span class="text-primary">{{ score1 > score2 ? player1Name : (score2 > score1 ? player2Name : 'Cognitive Draw') }}</span></h3>
             <button @click="leaveGame" class="px-12 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px]">RETURN TO NEXUS</button>
          </div>
       </div>

       <!-- Icon-Only Triggers -->
       <div class="flex items-center justify-center gap-6 mt-8">
          <button @click="toggleVoice" :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center border transition-all', voiceStore.isInVoice ? 'bg-emerald-600 border-emerald-500' : 'bg-black/40 border-white/10 text-slate-500')">
             <span class="text-2xl">{{ voiceStore.isInVoice ? '🎙️' : '🔇' }}</span>
          </button>
          <button @click="showChatPopup = !showChatPopup" class="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-500">
             <span class="text-2xl">💬</span>
          </button>
       </div>
    </div>
  </div>
</template>
