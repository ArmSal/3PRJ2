<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'
import type { SnakeState } from '@/types'

const gameStore = useGameStore()
const userStore = useUserStore()

const snakeCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const animationId = ref<number | null>(null)

const inGame = ref(false)
const loading = ref(false)
const myGameId = ref<string | null>(null)
const playerRole = ref<'Player 1' | 'Player 2' | ''>('')
const score1 = ref(0)
const score2 = ref(0)

const gameState = ref<SnakeState>({
  snake1: [],
  snake2: [],
  food: { x: 10, y: 10 },
  score1: 0,
  score2: 0,
  gameOver: false
})

const GRID_SIZE = 20
const TILE_COUNT = 20

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
      if (snakeCanvas.value) {
        ctx.value = snakeCanvas.value.getContext('2d')
      }
    })

    playerRole.value = data.player1 === userStore.currentUserId ? 'Player 1' : 'Player 2'
  })

  socket.on('snake-state', (state: SnakeState) => {
    gameState.value = state
    score1.value = state.score1 || 0
    score2.value = state.score2 || 0
  })

  socket.on('game-ended', () => {
    gameState.value.gameOver = true
  })
}

const createGame = () => {
  loading.value = true
  gameStore.socket?.emit('create-game', { channelId: 1, gameType: 'snake' })
}

const joinGame = (gameId: string) => {
  gameStore.socket?.emit('join-game', { gameId })
}

const leaveGame = () => {
  inGame.value = false
  myGameId.value = null
  playerRole.value = ''
  gameState.value.gameOver = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!inGame.value || gameState.value.gameOver) return
  
  const keyMap: Record<string, string> = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right'
  }
  
  const direction = keyMap[e.key]
  if (direction && myGameId.value) {
    gameStore.socket?.emit('snake-move', { 
      gameId: myGameId.value, 
      direction 
    })
  }
}

const draw = () => {
  if (!ctx.value || !inGame.value) return
  
  // Tactical Grid Background
  ctx.value.fillStyle = '#090b11'
  ctx.value.fillRect(0, 0, 400, 400)
  
  // Grid scanlines
  ctx.value.strokeStyle = '#1e293b'
  ctx.value.lineWidth = 0.5
  ctx.value.setLineDash([2, 4])
  for (let i = 0; i <= TILE_COUNT; i++) {
    ctx.value.beginPath(); ctx.value.moveTo(i * GRID_SIZE, 0); ctx.value.lineTo(i * GRID_SIZE, 400); ctx.value.stroke()
    ctx.value.beginPath(); ctx.value.moveTo(0, i * GRID_SIZE); ctx.value.lineTo(400, i * GRID_SIZE); ctx.value.stroke()
  }
  ctx.value.setLineDash([])
  
  // Neural Food (Pulse)
  const pulse = Math.sin(Date.now() / 200) * 4
  ctx.value.fillStyle = '#f43f5e'
  ctx.value.shadowBlur = 15 + pulse
  ctx.value.shadowColor = '#f43f5e'
  ctx.value.beginPath()
  ctx.value.arc(
    gameState.value.food.x * GRID_SIZE + GRID_SIZE / 2,
    gameState.value.food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 4 + pulse / 2,
    0, Math.PI * 2
  )
  ctx.value.fill()
  ctx.value.shadowBlur = 0
  
  // Combat Units (Snakes)
  drawSnake(gameState.value.snake1, '#10b981', '#34d399') // Emerald Player
  drawSnake(gameState.value.snake2, '#3b82f6', '#60a5fa') // Azure Player
}

const drawSnake = (segments: Array<{x: number, y: number}>, baseColor: string, headColor: string) => {
  if (!ctx.value || !segments) return
  segments.forEach((seg, i) => {
    ctx.value!.fillStyle = i === 0 ? headColor : baseColor
    // Segment with inner glow-gap
    ctx.value!.fillRect(seg.x * GRID_SIZE + 1.5, seg.y * GRID_SIZE + 1.5, GRID_SIZE - 3, GRID_SIZE - 3)
    
    // Directional head indicator
    if (i === 0) {
       ctx.value!.fillStyle = '#ffffff'
       ctx.value!.fillRect(seg.x * GRID_SIZE + 8, seg.y * GRID_SIZE + 8, 4, 4)
    }
  })
}

const gameLoop = () => {
  draw()
  animationId.value = requestAnimationFrame(gameLoop)
}
</script>

<template>
  <div class="h-full w-full p-10 flex flex-col items-center overflow-y-auto custom-scrollbar relative animate-in zoom-in-95 duration-500 selection:bg-primary/20">
    
    <!-- HEADER HUD -->
    <div class="w-full max-w-2xl flex justify-between items-end mb-12">
       <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-2">
             <div :class="cn('w-2 h-2 rounded-full animate-ping', inGame ? 'bg-emerald-500' : 'bg-amber-500')"></div>
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
               {{ inGame ? 'Tactical Engagement' : 'Standing By' }}
             </span>
          </div>
          <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Snake Arena</h2>
       </div>

       <div v-if="inGame" class="flex items-center gap-10 glass-blur px-8 py-3 rounded-2xl border border-white/5 shadow-2xl">
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
    </div>
    
    <!-- LOBBY / PRE-GAME -->
    <div v-if="!inGame" class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="glass-blur p-8 rounded-[32px] border border-white/5 flex flex-col justify-between group overflow-hidden relative">
        <!-- Decoration -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div>
          <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-4">Host Neutral Arena</h3>
          <p class="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
            Protocol: Initialize a secure neural combat zone and wait for a challenger to initiate standard engagement protocols.
          </p>
        </div>
        <button @click="createGame" :disabled="loading" class="mt-10 px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
          {{ loading ? 'ENCRYPTING...' : 'INITIALIZE LOBBY ⚡' }}
        </button>
      </div>
      
      <div class="glass-blur p-8 rounded-[32px] border border-white/5">
        <h3 class="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Active Lobbies</h3>
        <div v-if="gameStore.availableGames.filter(g => g.gameType === 'snake').length === 0" class="py-12 flex flex-col items-center text-slate-700">
           <span class="text-4xl mb-4 grayscale opacity-30">📡</span>
           <span class="text-[10px] font-black uppercase tracking-[0.2em]">Searching for neural signatures...</span>
        </div>
        <div v-else class="space-y-4">
          <div v-for="game in gameStore.availableGames.filter(g => g.gameType === 'snake')" :key="game.gameId" class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group">
             <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black italic border border-indigo-500/20">
                   {{ game.player1.charAt(0) }}
                </div>
                <div class="flex flex-col">
                   <span class="text-xs font-black italic text-white uppercase">{{ game.player1 }}</span>
                   <span class="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Ready for engage</span>
                </div>
             </div>
             <button @click="joinGame(game.gameId)" class="px-5 py-2 bg-slate-800 text-[9px] font-black italic uppercase tracking-widest rounded-xl hover:bg-emerald-600 active:scale-95 transition-all">
                CHALLENGE
             </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- GAME ARENA -->
    <div v-else class="relative group animate-in zoom-in-95 duration-700">
       <!-- Combat Canvas Shadow -->
       <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[24px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
       
       <div class="relative bg-[#090b11] rounded-[24px] overflow-hidden border-4 border-slate-900 shadow-2xl">
          <canvas ref="snakeCanvas" width="400" height="400"></canvas>
          
          <!-- GAMEOVER OVERLAY -->
          <div v-if="gameState.gameOver" class="absolute inset-0 bg-[#090b11]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div class="text-center mb-8">
                <h3 class="text-5xl font-black italic tracking-tighter text-red-500 uppercase leading-[0.8] mb-4">Neural <br /> Termination</h3>
                <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Engagement Offline</p>
             </div>
             <button @click="leaveGame" class="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black italic uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all shadow-2xl">
                RETURN TO NEXUS
             </button>
          </div>
       </div>

       <!-- CONTROLS FOOTER -->
       <div class="mt-12 flex justify-between items-center w-full max-w-2xl px-6">
          <div class="flex items-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
             <div class="flex flex-col items-center gap-1">
                <div class="flex gap-1"><div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black border-b-4 border-black">W</div></div>
                <div class="flex gap-1">
                   <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black border-b-4 border-black">A</div>
                   <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black border-b-4 border-black">S</div>
                   <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black border-b-4 border-black">D</div>
                </div>
             </div>
             <div class="flex flex-col">
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Directional Protocol</span>
                <span class="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Intercept Neural Payload</span>
             </div>
          </div>

          <div class="flex flex-col items-end">
             <span class="text-[10px] font-black italic text-primary uppercase mb-1">Link Identity</span>
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
/* High-performance canvas container */
canvas {
  width: 400px;
  height: 400px;
  image-rendering: pixelated;
}
</style>
