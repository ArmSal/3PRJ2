<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
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
const board = ref<string[][] | null>(null)
const turn = ref<'w' | 'b'>('w')
const selected = ref<{ x: number, y: number } | null>(null)
const winner = ref<number | null>(null)

const winnerMessage = computed(() => {
  if (winner.value === null) return "STALEMATE"
  return winner.value === userStore.currentUserId ? "STRATEGIC VICTORY" : "COMMAND TERMINATED"
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
  })
  
  socket.on('game-started', (data: { gameId: string }) => {
    gameStarted.value = true
    isWaiting.value = false
    myGameId.value = data.gameId
  })
  
  socket.on('chess-state', (state: any) => {
    board.value = state.board
    turn.value = state.turn
    gameOver.value = state.gameOver
  })
  
  socket.on('game-ended', (data: { winner: number }) => {
    gameOver.value = true
    winner.value = data.winner
  })
}

const createGame = () => {
  gameStore.socket?.emit('create-game', { channelId: 1, gameType: 'chess' })
}

const joinGame = (gameId: string) => {
  gameStore.socket?.emit('join-game', { gameId })
}

const leaveGame = () => router.push('/app/games')

const clickCell = (x: number, y: number) => {
  if (selected.value) {
    if (selected.value.x !== x || selected.value.y !== y) {
      gameStore.socket?.emit('chess-move', {
        gameId: myGameId.value,
        from: selected.value,
        to: { x, y }
      })
    }
    selected.value = null
  } else {
    if (board.value?.[y][x]) {
      selected.value = { x, y }
    }
  }
}

const getPieceSymbol = (piece: string) => {
  const symbols: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  }
  return symbols[piece] || ''
}

const resetGame = () => {
  gameStarted.value = false
  gameOver.value = false
  isWaiting.value = false
  board.value = null
  createGame()
}
</script>

<template>
  <div class="h-full w-full p-10 flex flex-col items-center overflow-y-auto custom-scrollbar animate-in fade-in duration-700">
    
    <!-- HEADER HUD -->
    <div class="w-full max-w-2xl flex justify-between items-end mb-12">
       <div class="flex flex-col">
          <div class="flex items-center gap-3 mb-2">
             <div :class="cn('w-2 h-2 rounded-full animate-ping', gameStarted ? 'bg-emerald-500' : 'bg-amber-500')"></div>
             <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
               {{ gameStarted ? 'Tactical Command' : 'Awaiting Engagement' }}
             </span>
          </div>
          <h2 class="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Chess Matrix</h2>
       </div>

       <div v-if="gameStarted && !gameOver" class="flex items-center gap-6 glass-blur px-6 py-2 rounded-xl border border-white/5">
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Turn:</span>
          <div class="flex items-center gap-2">
             <div :class="cn('w-3 h-3 rounded-sm border border-white/20', turn === 'w' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-900')"></div>
             <span class="text-xs font-black italic uppercase text-white">{{ turn === 'w' ? 'White' : 'Black' }}</span>
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
            ♟️
         </div>
         <h3 class="text-4xl font-black italic tracking-tighter text-white mb-4 uppercase leading-none">Grandmaster Protocol</h3>
         <p class="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-md mb-12">
            Establish a zero-latency tactical board link. Execute high-fidelity grandmaster simulations in real-time combat.
         </p>
         <button @click="createGame" class="px-12 py-5 bg-primary text-white rounded-2xl font-black italic uppercase tracking-[0.2em] text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            INITIALIZE ENCOUNTER ⚡
         </button>
      </div>

      <!-- WAITING -->
      <div v-else-if="isWaiting" class="glass-blur rounded-[40px] p-16 flex flex-col items-center text-center border border-white/5">
         <div class="flex gap-3 mb-10">
            <div class="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <div class="w-3 h-3 bg-primary rounded-full animate-pulse delay-150"></div>
            <div class="w-3 h-3 bg-primary rounded-full animate-pulse delay-300"></div>
         </div>
         <h3 class="text-2xl font-black italic tracking-tighter text-white mb-2 uppercase">Awaiting Challenger...</h3>
         <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Command Link: #{{ myGameId?.split('-')[0] }}</p>
      </div>

      <!-- ACTIVE GAME -->
      <div v-else-if="!gameOver && board" class="flex flex-col items-center animate-in slide-in-from-bottom-6 duration-700">
         <div class="relative board-shadow group">
            <!-- Decorative corner elements -->
            <div class="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl"></div>
            <div class="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-indigo-500/40 rounded-tr-xl"></div>
            <div class="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-indigo-500/40 rounded-bl-xl"></div>
            <div class="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl"></div>

            <div class="chess-grid bg-slate-900 border-8 border-slate-950 p-1 rounded-sm shadow-2xl">
               <div v-for="(row, y) in board" :key="y" class="flex">
                  <div 
                     v-for="(cell, x) in row" 
                     :key="x"
                     @click="clickCell(x, y)"
                     :class="cn(
                        'w-14 h-14 flex items-center justify-center text-3xl cursor-pointer transition-all duration-200 relative group/cell',
                        (x + y) % 2 === 1 ? 'bg-[#1e293b]' : 'bg-[#334155]',
                        selected && selected.x === x && selected.y === y && 'bg-primary/40 shadow-[inset_0_0_15px_rgba(59,130,246,0.6)]'
                     )"
                  >
                     <div v-if="cell" :class="cn(
                        'piece-icon transition-transform duration-300 group-hover/cell:scale-110 drop-shadow-lg',
                        cell === cell.toUpperCase() ? 'text-white' : 'text-slate-950'
                     )">
                        {{ getPieceSymbol(cell) }}
                     </div>
                     
                     <!-- Grid coordinate hints -->
                     <span v-if="y === 7" class="absolute bottom-0.5 right-1 text-[8px] font-black text-white/10">{{ String.fromCharCode(97 + x) }}</span>
                     <span v-if="x === 0" class="absolute top-0.5 left-1 text-[8px] font-black text-white/10">{{ 8 - y }}</span>
                  </div>
               </div>
            </div>
         </div>

         <div class="mt-12 flex gap-8">
            <div class="flex items-center gap-4 opacity-30 hover:opacity-100 transition-all">
               <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center italic font-black border border-white/5 group hover:border-primary/50 transition-all">⌥</div>
               <div class="flex flex-col">
                  <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Command Lock</span>
                  <span class="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">Click Piece To Target</span>
               </div>
            </div>
         </div>
      </div>

      <!-- GAME OVER -->
      <div v-else-if="gameOver" class="glass-blur rounded-[40px] p-16 flex flex-col items-center text-center border border-white/5 animate-in scale-in-95 duration-700">
         <div class="text-7xl mb-8 group hover:rotate-12 transition-transform duration-500 cursor-default">👑</div>
         <h2 class="text-6xl font-black italic text-white tracking-tighter mb-4 uppercase leading-none">{{ winnerMessage }}</h2>
         <p class="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-12 italic">Tactical simulation Offline</p>

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
.chess-grid {
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.piece-icon {
  user-select: none;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
}

.board-shadow {
  box-shadow: 0 0 60px rgba(59, 130, 246, 0.1);
}

.glass-blur {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
