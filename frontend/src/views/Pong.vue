<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { cn } from '@/lib/utils'
import type { Game } from '@/types'

const gameStore = useGameStore()
const userStore = useUserStore()
const chatStore = useChatStore()

const pongCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const animationId = ref<number | null>(null)

const inGame = ref(false)
const loading = ref(false)
const myGameId = ref<string | null>(null)
const playerRole = ref<'Player 1' | 'Player 2' | ''>('')
const score1 = ref(0)
const score2 = ref(0)

const gameState = ref({
  ball: { x: 400, y: 200, radius: 8 },
  paddle1: { y: 150, height: 100, width: 10 },
  paddle2: { y: 150, height: 100, width: 10 },
  score1: 0,
  score2: 0,
  countdown: 0,
  gameOver: false
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

const initGame = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket
  if (!socket) return

  socket.on('game-created', (data: { gameId: string }) => {
    myGameId.value = data.gameId
    loading.value = false
  })

  socket.on('game-started', (data: { gameId: string, player1: number }) => {
    inGame.value = true
    myGameId.value = data.gameId
    
    nextTick(() => {
      if (pongCanvas.value) {
        ctx.value = pongCanvas.value.getContext('2d')
      }
    })

    playerRole.value = data.player1 === userStore.currentUserId ? 'Player 1' : 'Player 2'
  })

  socket.on('pong-state', (state: any) => {
    gameState.value = state
    score1.value = state.score1 || 0
    score2.value = state.score2 || 0
  })

  socket.on('game-ended', () => {
    gameState.value.gameOver = true
  })
}

const createGame = () => {
  if (!chatStore.selectedChannel) {
     console.error('🛑 [GAME] Error: Identity tactical link failed. No channel selected.');
     return;
  }
  loading.value = true
  gameStore.socket?.emit('create-game', { 
    channelId: chatStore.selectedChannel.id, 
    gameType: 'pong' 
  })
}

const joinGame = (game: Game) => {
  gameStore.socket?.emit('join-game', { 
    gameId: game.gameId,
    player1Id: game.player1Id,
    gameType: 'pong'
  })
}

const leaveGame = () => {
  inGame.value = false
  myGameId.value = null
  playerRole.value = ''
  gameState.value.gameOver = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!inGame.value || gameState.value.gameOver) return
  
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    movePaddle('up')
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    movePaddle('down')
  }
}

const movePaddle = (dir: 'up' | 'down') => {
  if (myGameId.value) {
    gameStore.socket?.emit('pong-move', { 
      gameId: myGameId.value, 
      direction: dir 
    })
  }
}

const draw = () => {
  if (!ctx.value || !pongCanvas.value || !inGame.value) return
  
  const width = 800
  const height = 400

  // Background
  ctx.value.fillStyle = '#090b11'
  ctx.value.fillRect(0, 0, width, height)
  
  // Center scanline
  ctx.value.strokeStyle = '#1e293b'
  ctx.value.lineWidth = 2
  ctx.value.setLineDash([10, 15])
  ctx.value.beginPath(); ctx.value.moveTo(width / 2, 0); ctx.value.lineTo(width / 2, height); ctx.value.stroke()
  ctx.value.setLineDash([])
  
  // Neon Ball
  const pulse = Math.sin(Date.now() / 150) * 2
  ctx.value.fillStyle = '#ffffff'
  ctx.value.shadowBlur = 15 + pulse
  ctx.value.shadowColor = '#ffffff'
  ctx.value.beginPath()
  ctx.value.arc(gameState.value.ball.x, gameState.value.ball.y, gameState.value.ball.radius + pulse, 0, Math.PI * 2)
  ctx.value.fill()
  ctx.value.shadowBlur = 0
  
  // Neural Paddles
  drawPaddle(0, gameState.value.paddle1.y, '#10b981') // Emerald Player (Left)
  drawPaddle(width - 10, gameState.value.paddle2.y, '#3b82f6') // Azure Player (Right)
  
  // Technical Countdown Overlay
  if (gameState.value.countdown > 0) {
    ctx.value.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.value.fillRect(0, 0, width, height)
    
    ctx.value.font = '900 italic 80px sans-serif'
    ctx.value.fillStyle = '#ffffff'
    ctx.value.textAlign = 'center'
    ctx.value.shadowBlur = 30
    ctx.value.shadowColor = '#ffffff'
    ctx.value.fillText(`T - ${gameState.value.countdown}`, width / 2, height / 2 + 30)
    ctx.value.shadowBlur = 0
    
    ctx.value.font = '900 12px sans-serif'
    ctx.value.fillStyle = '#64748b'
    ctx.value.fillText('NEURAL LINK STABILIZING', width / 2, height / 2 + 70)
  }
}

const drawPaddle = (x: number, y: number, color: string) => {
  if (!ctx.value) return
  ctx.value.fillStyle = color
  ctx.value.shadowBlur = 20
  ctx.value.shadowColor = color
  ctx.value.fillRect(x + 2, y, 6, 100)
  ctx.value.shadowBlur = 0
}

const gameLoop = () => {
  draw()
  animationId.value = requestAnimationFrame(gameLoop)
}
</script>

<template>
  <div class="h-full w-full p-10 flex flex-col items-center overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 duration-500 selection:bg-primary/20">
    
    <!-- HEADER HUD -->
    <div class="w-full max-w-4xl flex justify-between items-end mb-12">
       <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-2">
             <div :class="cn('w-2 h-2 rounded-full animate-ping', inGame ? 'bg-emerald-500' : 'bg-amber-500')"></div>
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
               {{ inGame ? 'Tactical Engagement' : 'Standing By' }}
             </span>
          </div>
          <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Pong Combat</h2>
       </div>

       <div v-if="inGame" class="flex items-center gap-10 glass-blur px-10 py-4 rounded-2xl border border-white/5 shadow-2xl">
          <div class="flex flex-col items-center">
             <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Link_Left</span>
             <span class="text-3xl font-black italic text-white">{{ score1 }}</span>
          </div>
          <div class="text-slate-700 font-bold italic text-2xl">VS</div>
          <div class="flex flex-col items-center">
             <span class="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Link_Right</span>
             <span class="text-3xl font-black italic text-white">{{ score2 }}</span>
          </div>
       </div>
    </div>
    
    <!-- LOBBY / PRE-GAME -->
    <div v-if="!inGame" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col justify-between group overflow-hidden relative">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div>
          <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-4">Initialize Combat Channel</h3>
          <p class="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
            Protocol: Establish a point-to-point neural paddle link. Standard physics simulation at 120Hz refresh rate.
          </p>
        </div>
        <button @click="createGame" :disabled="loading" class="mt-10 px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
          {{ loading ? 'INITIALIZING...' : 'OPEN CHANNEL ⚡' }}
        </button>
      </div>
      
      <div class="glass-blur p-8 rounded-[32px] border border-white/5">
        <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Active Signals</h3>
        <div v-if="gameStore.availableGames.filter(g => g.gameType === 'pong').length === 0" class="py-12 flex flex-col items-center text-slate-700">
           <span class="text-4xl mb-4 grayscale opacity-30">📡</span>
           <span class="text-[10px] font-black uppercase tracking-[0.2em]">Searching for active frequencies...</span>
        </div>
        <div v-else class="space-y-4">
          <div v-for="game in gameStore.availableGames.filter(g => g.gameType === 'pong')" :key="game.gameId" class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black italic border border-indigo-500/20">
                   {{ (game.player1 || 'U').charAt(0).toUpperCase() }}
                 </div>
                 <div class="flex flex-col">
                    <span class="text-xs font-black italic text-white uppercase">{{ game.player1 }}</span>
                    <span class="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Ready to Engage</span>
                 </div>
              </div>
              <button @click="joinGame(game)" class="px-5 py-2 bg-slate-800 text-[9px] font-black italic uppercase tracking-widest rounded-xl hover:bg-emerald-600 active:scale-95 transition-all">
                 ENGAGE
              </button>
           </div>
        </div>
      </div>
    </div>
    
    <!-- GAME ARENA -->
    <div v-else class="relative group animate-in zoom-in-95 duration-700">
       <div class="relative bg-[#090b11] rounded-[32px] overflow-hidden border-4 border-slate-900 shadow-[0_0_50px_rgba(30,41,59,0.3)]">
          <canvas ref="pongCanvas" width="800" height="400"></canvas>
          
          <!-- GAMEOVER OVERLAY -->
          <div v-if="gameState.gameOver" class="absolute inset-0 bg-[#090b11]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div class="text-center mb-8">
                <h3 class="text-5xl font-black italic tracking-tighter text-red-500 uppercase leading-[0.8] mb-4">Neural <br /> Termination</h3>
                <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Combat Log Offline</p>
             </div>
             <button @click="leaveGame" class="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all shadow-2xl">
                RETURN TO NEXUS
             </button>
          </div>
       </div>

       <!-- CONTROLS FOOTER -->
       <div class="mt-12 flex justify-between items-center w-full max-w-4xl px-8">
          <div class="flex items-center gap-8 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
             <div class="flex flex-col items-center gap-1">
                <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black border-b-4 border-black mb-1">W</div>
                <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black border-b-4 border-black">S</div>
             </div>
             <div class="flex flex-col">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Vertical Axis Protocol</span>
                <span class="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Maintain Neural Defenses</span>
             </div>
          </div>

          <div class="flex flex-col items-end">
             <span class="text-[10px] font-black italic text-primary uppercase mb-1">Operator Profile</span>
             <div class="flex items-center gap-3">
                <span class="text-xs font-black italic text-white uppercase">{{ userStore.user?.username }}</span>
                <div :class="cn('w-2 h-2 rounded-full', playerRole === 'Player 1' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]')"></div>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  width: 800px;
  height: 400px;
  image-rendering: auto;
}
</style>
