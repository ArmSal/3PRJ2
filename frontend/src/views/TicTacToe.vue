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
const board = ref<(string | null)[]>(Array(9).fill(null))
const turn = ref<number | null>(null)
const player1Name = ref('Operator_1')
const player2Name = ref('Operator_2')
const countdown = ref(5)
const winner = ref<number | null>(null)
const showChatPopup = ref(false)

// Toast & Volatile Chat state
const gameToasts = ref<{ id: number, content: string, username: string, opacity: number }[]>([])
const volatileMessages = ref<{ id: number, content: string, username: string }[]>([])
let toastCounter = 0

onMounted(() => { initSocket(); const joinId = route.query.join as string; if (joinId) joinGame({ gameId: joinId, player1Id: 0, player1: 'Searching...' }) })

// Volatile Logic: Only keep messages for 1 second in the in-game popup
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
  socket.on('ttt-state', (state: any) => { board.value = state.board; turn.value = state.turn; countdown.value = state.countdown; gameOver.value = state.gameOver; winner.value = state.winner })
}

const createGame = () => { if (!chatStore.selectedChannel) return; gameStore.socket?.emit('create-game', { channelId: chatStore.selectedChannel.id, gameType: 'ttt' }) }

const joinGame = (game: any) => { gameStore.socket?.emit('join-game', { gameId: game.gameId, player1Id: game.player1Id, player1: game.player1 || game.player1Name, gameType: 'ttt' }) }

const makeMove = (index: number) => { gameStore.socket?.emit('ttt-move', { gameId: myGameId.value, index }) }

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
    <div class="w-full max-w-2xl flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 gap-6 text-center md:text-left">
       <div class="flex flex-col items-center md:items-start text-center md:text-left">
          <div class="flex items-center gap-3 mb-2"><div :class="cn('w-2 h-2 rounded-full animate-ping', inGame ? 'bg-emerald-500' : 'bg-amber-500')"></div><span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{{ inGame ? 'Tactical Execute' : 'Neural Link Idle' }}</span></div>
          <h2 class="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none italic">Tic Tac Toe</h2>
       </div>
       <div v-if="inGame" class="flex items-center gap-6 glass-blur px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
          <div class="flex flex-col items-center"><span :class="cn('text-[8px] font-black uppercase tracking-widest mb-1', turn === 1 ? 'text-emerald-500' : 'text-slate-600')">{{ player1Name }} (X)</span><span class="text-2xl font-black italic text-white">{{ turn === 1 ? 'ACTIVE' : 'WAIT' }}</span></div>
          <div class="text-slate-700 font-bold italic text-xl">VS</div>
          <div class="flex flex-col items-center"><span :class="cn('text-[8px] font-black uppercase tracking-widest mb-1', turn !== 1 ? 'text-blue-500' : 'text-slate-600')">{{ player2Name }} (O)</span><span class="text-2xl font-black italic text-white">{{ turn !== 1 ? 'ACTIVE' : 'WAIT' }}</span></div>
       </div>
    </div>
    
    <!-- LOBBY -->
    <div v-if="!inGame" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
      <div v-if="!isWaiting" class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col justify-between group overflow-hidden relative min-h-[280px]">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        <div><h3 class="text-xl font-black italic uppercase text-white mb-4">Initialize Grid Link</h3><p class="text-xs font-bold text-slate-500 uppercase tracking-wide italic">Protocol: Establish 3x3 tactical matrix. Awaiting Challenger signature.</p></div>
        <button @click="createGame" class="mt-10 px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl transition-all">INITIALIZE⚡</button>
      </div>
      <div v-else class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-center"><div class="flex gap-2 mb-6"><div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div><div class="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div><div class="w-2 h-2 bg-primary rounded-full animate-bounce delay-300"></div></div><h3 class="text-xl font-black italic text-white uppercase italic tracking-tighter">Broadcasting Link Signature</h3></div>
      <div class="glass-blur p-8 rounded-[32px] border border-white/5">
        <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Active Signatures</h3>
        <div v-if="gameStore.availableGames.filter((g: any) => g.gameType === 'ttt').length === 0" class="py-12 flex flex-col items-center text-slate-700 opacity-40"><span class="text-4xl mb-4">❎</span><span class="text-[10px] font-black uppercase tracking-[0.2em]">Scanning for intelligence...</span></div>
        <div v-else class="space-y-3">
          <div v-for="game in (gameStore.availableGames.filter((g: any) => g.gameType === 'ttt') as any[])" :key="game.gameId" class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/20 transition-all items-center">
             <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center font-black italic text-slate-400">H</div><span class="text-xs font-black italic text-white uppercase">{{ game.player1 }}</span></div>
             <button @click="joinGame(game)" class="px-5 py-2 bg-slate-800 text-[9px] font-black italic uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-xl">CHALLENGE</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- TTT ARENA -->
    <div v-else class="relative animate-in zoom-in-95 duration-700 w-full max-w-md flex flex-col items-center">
       <div class="relative bg-black rounded-[40px] p-6 md:p-8 border-4 border-slate-900 shadow-2xl overflow-hidden aspect-square w-full">
          <div class="grid grid-cols-3 gap-3 h-full">
             <div v-for="(cell, i) in board" :key="i" @click="makeMove(i)" :class="cn('flex items-center justify-center text-5xl font-black transition-all cursor-pointer rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-800', cell === 'X' ? 'text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : (cell === 'O' ? 'text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : ''))">
                {{ cell }}
             </div>
          </div>

          <!-- TOAST OVERLAY (Standardized) -->
          <div class="absolute inset-0 pointer-events-none flex flex-col items-center pt-10 gap-2">
             <div v-for="toast in gameToasts" :key="toast.id" :style="{ opacity: toast.opacity }" class="bg-black/95 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full transform transition-all duration-300 shadow-2xl">
                <span class="text-[10px] font-black italic text-primary uppercase mr-2">{{ toast.username }}:</span>
                <span class="text-[10px] font-bold text-white uppercase tracking-tight">{{ toast.content }}</span>
             </div>
          </div>

          <!-- COUNTDOWN OVERLAY (Standardized) -->
          <div v-if="countdown > 0" class="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500 z-50">
             <span class="text-9xl font-black italic text-primary animate-pulse drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">{{ countdown }}</span>
          </div>

          <!-- GAMEOVER VICTORY PROTOCOL (Standardized) -->
          <div v-if="gameOver" class="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500 p-8 rounded-[36px] z-[60]">
             <div class="mb-6 flex flex-col items-center text-center">
                <div class="text-6xl mb-6 animate-bounce">👑</div>
                <h3 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-tight mb-2">Neural Dominance<br/><span class="text-primary">{{ winner === 1 ? player1Name : (winner ? player2Name : 'Protocol Draw') }}</span></h3>
                <div v-if="winner" class="text-xs font-black text-slate-600 uppercase tracking-[0.2em] mb-6 italic">Grid Occupied Successfully</div>
             </div>
             <button @click="leaveGame" class="px-12 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all">RETURN TO NEXUS</button>
          </div>
       </div>

       <!-- ICON-ONLY CONTROLS -->
       <div class="flex items-center justify-center gap-6 mt-8">
          <button @click="toggleVoice" :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-xl', voiceStore.isInVoice ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white')">
             <span class="text-2xl">{{ voiceStore.isInVoice ? '🎙️' : '🔇' }}</span>
          </button>
          <button @click="showChatPopup = !showChatPopup" class="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
             <span class="text-2xl">💬</span>
          </button>
       </div>

       <!-- VOLATILE QUICK CHAT (Self-Deleting) -->
       <div v-if="showChatPopup" class="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 bg-black/98 border border-white/10 rounded-[28px] backdrop-blur-2xl z-40 p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
          <div class="flex items-center justify-between mb-3 px-1"><span class="text-[8px] font-black uppercase text-slate-700 tracking-widest italic leading-none">Volatile Signal Hub</span><button @click="showChatPopup = false" class="text-slate-800 hover:text-white text-xs">✕</button></div>
          <div class="flex-1 min-h-[60px] max-h-40 overflow-y-auto mb-4 space-y-3 px-1 custom-scrollbar">
             <div v-for="msg in volatileMessages" :key="msg.id" class="flex flex-col animate-in fade-in duration-200">
                <span class="text-[7px] font-black text-primary uppercase italic mb-0.5">{{ msg.username }}</span>
                <p class="text-[11px] text-white leading-tight uppercase font-bold">{{ msg.content }}</p>
             </div>
             <div v-if="volatileMessages.length === 0" class="text-center py-4 opacity-5"><span class="text-[8px] font-black uppercase italic tracking-widest">No Signals</span></div>
          </div>
          <input @keyup.enter="(e: any) => { sendQuickMessage(e.target.value); e.target.value = '' }" type="text" placeholder="Protocol input..." class="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-primary text-slate-400 italic uppercase" />
       </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 2px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>
