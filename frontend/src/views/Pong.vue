<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useVoiceStore } from '@/stores/voice'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'

const gameStore = useGameStore()
const userStore = useUserStore()
const chatStore = useChatStore()
const voiceStore = useVoiceStore()

const pongCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const animationId = ref<number | null>(null)

const inGame = ref(false)
const loading = ref(false)
const myGameId = ref<string | null>(null)
const playerRole = ref<'Player 1' | 'Player 2' | ''>('')
const showChatPopup = ref(false)
const score1 = ref(0)
const score2 = ref(0)
const player1Name = ref('Link_Left')
const player2Name = ref('Link_Right')

// Toast & Volatile Chat state
const gameToasts = ref<{ id: number, content: string, username: string, opacity: number }[]>([])
const volatileMessages = ref<{ id: number, content: string, username: string }[]>([])
let toastCounter = 0

const gameState = ref({
  ball: { x: 400, y: 200, radius: 8 },
  paddle1: { y: 150, height: 100, width: 10 },
  paddle2: { y: 150, height: 100, width: 10 },
  score1: 0,
  score2: 0,
  countdown: 0,
  gameOver: false,
  player1Name: 'Operator_1',
  player2Name: 'Operator_2'
})

onMounted(() => {
  initGame()
  window.addEventListener('keydown', handleKeyDown)
  gameLoop()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (animationId.value) cancelAnimationFrame(animationId.value)
})

// Volatile Logic: Only keep messages for 1 second in the in-game popup
watch(() => chatStore.messages, (newMsgs) => {
  if (inGame.value && newMsgs.length > 0) {
    const lastMsg = newMsgs[newMsgs.length - 1]
    addVolatileMessage(lastMsg.username, lastMsg.content)
  }
}, { deep: true })

const addVolatileMessage = (username: string, content: string) => {
  const id = toastCounter++
  // Add to Toast (Game Overlay)
  gameToasts.value.push({ id, content, username, opacity: 1 })
  // Add to Volatile list (Popup)
  volatileMessages.value.push({ id, content, username })
  
  // Fade Toasts over 2+1s
  setTimeout(() => {
    const interval = setInterval(() => {
      const t = gameToasts.value.find(x => x.id === id)
      if (t) { t.opacity -= 0.1; if (t.opacity <= 0) { gameToasts.value = gameToasts.value.filter(x => x.id !== id); clearInterval(interval) } }
      else clearInterval(interval)
    }, 100)
  }, 2000)

  // Clear from Volatile Popup list after 1 second exactly
  setTimeout(() => {
    volatileMessages.value = volatileMessages.value.filter(m => m.id !== id)
  }, 1000)
}

const initGame = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket
  if (!socket) return

  socket.on('pong-state', (state: any) => {
    gameState.value = state
    score1.value = state.score1; score2.value = state.score2
    if (state.player1Name) player1Name.value = state.player1Name
    if (state.player2Name) player2Name.value = state.player2Name
  })

  socket.on('game-started', (data: any) => {
    inGame.value = true; myGameId.value = data.gameId
    player1Name.value = data.player1Name; player2Name.value = data.player2Name
    nextTick(() => { if (pongCanvas.value) ctx.value = pongCanvas.value.getContext('2d') })
    playerRole.value = data.player1 === userStore.currentUserId ? 'Player 1' : 'Player 2'
  })

  socket.on('game-ended', () => { gameState.value.gameOver = true })
}

const createGame = () => {
  if (!chatStore.selectedChannel) return
  loading.value = true
  gameStore.socket?.emit('create-game', { channelId: chatStore.selectedChannel.id, gameType: 'pong' })
}

const joinGame = (game: any) => {
  gameStore.socket?.emit('join-game', { gameId: game.gameId, player1Id: game.player1Id, player1: game.player1, gameType: 'pong' })
}

const leaveGame = () => { inGame.value = false; myGameId.value = null; playerRole.value = ''; gameState.value.gameOver = false }

const toggleVoice = async () => {
  if (voiceStore.isInVoice) voiceStore.leaveVoice(gameStore.socket)
  else if (chatStore.selectedChannel) await voiceStore.joinVoice(chatStore.selectedChannel.id, gameStore.socket)
}

const sendQuickMessage = (content: string) => {
  if (!chatStore.selectedChannel || !content.trim()) return
  gameStore.socket?.emit('send-message', { channelId: chatStore.selectedChannel.id, content, userId: userStore.currentUserId, username: userStore.user?.username || 'Unknown', token: userStore.token })
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!inGame.value || gameState.value.gameOver) return
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') movePaddle('up')
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') movePaddle('down')
}

const movePaddle = (dir: 'up' | 'down') => {
  if (myGameId.value) gameStore.socket?.emit('pong-move', { gameId: myGameId.value, direction: dir })
}

const draw = () => {
  if (!ctx.value || !pongCanvas.value || !inGame.value) return
  const width = 800, height = 400
  ctx.value.fillStyle = '#090b11'; ctx.value.fillRect(0, 0, width, height)
  ctx.value.strokeStyle = '#1e293b'; ctx.value.lineWidth = 2; ctx.value.setLineDash([10, 15])
  ctx.value.beginPath(); ctx.value.moveTo(width / 2, 0); ctx.value.lineTo(width / 2, height); ctx.value.stroke(); ctx.value.setLineDash([])
  const pulse = Math.sin(Date.now() / 150) * 2
  ctx.value.fillStyle = '#ffffff'; ctx.value.shadowBlur = 15 + pulse; ctx.value.shadowColor = '#ffffff'
  ctx.value.beginPath(); ctx.value.arc(gameState.value.ball.x, gameState.value.ball.y, gameState.value.ball.radius + pulse, 0, Math.PI * 2); ctx.value.fill(); ctx.value.shadowBlur = 0
  drawPaddle(0, gameState.value.paddle1.y, '#10b981')
  drawPaddle(width - 10, gameState.value.paddle2.y, '#3b82f6')
}

const drawPaddle = (x: number, y: number, color: string) => {
  if (!ctx.value) return
  ctx.value.fillStyle = color; ctx.value.shadowBlur = 20; ctx.value.shadowColor = color
  ctx.value.fillRect(x + 2, y, 6, 100); ctx.value.shadowBlur = 0
}

const gameLoop = () => { draw(); animationId.value = requestAnimationFrame(gameLoop) }
</script>

<template>
  <div class="h-full w-full p-4 md:p-10 flex flex-col items-center overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 duration-500 selection:bg-primary/20">
    <!-- HEADER HUD -->
    <div class="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center md:items-end mb-8 md:mb-12 gap-6">
       <div class="flex flex-col items-center md:items-start text-center md:text-left">
          <div class="flex items-center gap-3 mb-2">
             <div :class="cn('w-2 h-2 rounded-full animate-ping', inGame ? 'bg-emerald-500' : 'bg-amber-500')"></div>
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{{ inGame ? 'Tactical Engage' : 'Frequency Scan' }}</span>
          </div>
          <h2 class="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Pong Combat</h2>
       </div>
       <div v-if="inGame" class="flex items-center gap-6 md:gap-10 glass-blur px-6 md:px-10 py-3 md:py-4 rounded-2xl border border-white/5 shadow-2xl">
          <div class="flex flex-col items-center"><span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">{{ player1Name }}</span><span class="text-2xl md:text-3xl font-black italic text-white">{{ score1 }}</span></div>
          <div class="text-slate-700 font-bold italic text-xl md:text-2xl">VS</div>
          <div class="flex flex-col items-center"><span class="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">{{ player2Name }}</span><span class="text-2xl md:text-3xl font-black italic text-white">{{ score2 }}</span></div>
       </div>
    </div>
    
    <!-- LOBBY -->
    <div v-if="!inGame" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col justify-between group relative overflow-hidden min-h-[280px]">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        <div>
          <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-4">Host Combat</h3>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wide italic">Initialize a zero-latency protocol and wait for challenger signal.</p>
        </div>
        <button @click="createGame" :disabled="loading" class="mt-10 px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl transition-all">INITIALIZE⚡</button>
      </div>
      <div class="glass-blur p-8 rounded-[32px] border border-white/5">
        <h3 class="text-xl font-black italic uppercase text-white mb-6">Active Signals</h3>
        <div v-if="gameStore.availableGames.filter((g: any) => g.gameType === 'pong').length === 0" class="py-12 flex flex-col items-center text-slate-700 opacity-40">
           <span class="text-4xl mb-4">📡</span>
           <span class="text-[10px] font-black uppercase tracking-[0.2em]">Searching for bandwidth...</span>
        </div>
        <div v-else class="space-y-3">
          <div v-for="game in gameStore.availableGames.filter((g: any) => g.gameType === 'pong')" :key="game.gameId" class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/20 transition-all items-center">
             <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center font-black italic text-slate-500">H</div><span class="text-xs font-black italic text-white uppercase">{{ game.player1 }}</span></div>
             <button @click="joinGame(game)" class="px-5 py-2 bg-slate-800 text-[9px] font-black italic uppercase tracking-widest rounded-xl transition-all">ENGAGE</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- ARENA -->
    <div v-else class="relative animate-in zoom-in-95 duration-700 w-full max-w-4xl flex flex-col items-center">
       <div class="relative bg-black rounded-[32px] overflow-hidden border-4 border-slate-900 shadow-2xl">
          <canvas ref="pongCanvas" width="800" height="400"></canvas>
          
          <!-- TOAST OVERLAY -->
          <div class="absolute inset-0 pointer-events-none flex flex-col items-center pt-8 gap-2">
             <div v-for="toast in gameToasts" :key="toast.id" :style="{ opacity: toast.opacity }" class="bg-black/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full transform transition-all duration-300">
                <span class="text-[10px] font-black italic text-primary uppercase mr-2">{{ toast.username }}:</span>
                <span class="text-[10px] font-bold text-white uppercase">{{ toast.content }}</span>
             </div>
          </div>

          <!-- GAMEOVER -->
          <div v-if="gameState.gameOver" class="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500 p-8 rounded-[30px]">
             <div class="mb-6 flex flex-col items-center"><div class="text-6xl mb-4 animate-bounce">👑</div><h3 class="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase text-center leading-tight mb-2">{{ score1 > score2 ? player1Name : player2Name }} <br /><span class="text-primary">Victory Confirmed</span></h3><div class="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-full border border-white/5 text-xl font-black italic text-slate-400">{{ score1 }} — {{ score2 }}</div></div>
             <button @click="leaveGame" class="px-12 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all">RETURN TO NEXUS</button>
          </div>
       </div>

       <!-- ICON-ONLY CONTROLS (Repositioned Under Cadre) -->
       <div class="flex items-center justify-center gap-6 mt-8">
          <button @click="toggleVoice" :class="cn('w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-xl', voiceStore.isInVoice ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white')">
             <span class="text-2xl">{{ voiceStore.isInVoice ? '🎙️' : '🔇' }}</span>
          </button>
          <button @click="showChatPopup = !showChatPopup" class="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
             <span class="text-2xl">💬</span>
          </button>
       </div>

       <!-- VOLATILE QUICK CHAT (Self-Deleting) -->
       <div v-if="showChatPopup" class="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 bg-black/95 border border-white/10 rounded-[28px] backdrop-blur-2xl z-40 p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
          <div class="flex items-center justify-between mb-3"><span class="text-[8px] font-black uppercase text-slate-600 tracking-widest italic">Encrypted Volatile Comms</span><button @click="showChatPopup = false" class="text-slate-800 hover:text-white">✕</button></div>
          <div class="flex-1 min-h-[60px] max-h-40 overflow-y-auto mb-4 space-y-3 px-1 custom-scrollbar">
             <div v-for="msg in volatileMessages" :key="msg.id" class="flex flex-col animate-in fade-in duration-200">
                <span class="text-[7px] font-black text-primary uppercase italic mb-0.5">{{ msg.username }}</span>
                <p class="text-[9px] text-white leading-tight uppercase font-bold">{{ msg.content }}</p>
             </div>
             <div v-if="volatileMessages.length === 0" class="text-center py-4 opacity-10"><span class="text-[8px] font-black uppercase italic tracking-widest">No Active Signals</span></div>
          </div>
          <input @keyup.enter="(e: any) => { sendQuickMessage(e.target.value); e.target.value = '' }" type="text" placeholder="Protocol input..." class="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-[10px] font-black outline-none focus:border-primary text-slate-400 italic uppercase" />
       </div>
    </div>
  </div>
</template>

<style scoped>
canvas { max-width: 100%; height: auto; aspect-ratio: 2 / 1; border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar { width: 2px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>
