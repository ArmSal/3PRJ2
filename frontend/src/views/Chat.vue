<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'
import { useVoiceStore } from '@/stores/voice'
import { cn } from '@/lib/utils'
import type { Message, User } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()
const gameStore = useGameStore()
const voiceStore = useVoiceStore()

const messagesContainer = ref<HTMLElement | null>(null)
const newMessage = ref('')
const showUserMenu = ref(false)
const isSidebarOpen = ref(false)

const isChildRoute = computed(() => route.path !== '/app' && route.path !== '/app/')
const activeTab = computed(() => {
  const path = route.path
  if (path.includes('/games') || path.includes('/pong') || path.includes('/snake') || path.includes('/trivia')) return 'games'
  if (path.includes('/tournaments')) return 'tournaments'
  if (path.includes('/settings')) return 'settings'
  if (path.includes('/leaderboard')) return 'leaderboard'
  return 'chat'
})

onMounted(async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await chatStore.fetchGuilds()
  initSocket()
})

watch(() => chatStore.selectedGuild, async (newGuild) => {
  if (newGuild) {
    await chatStore.fetchChannels(newGuild.id)
  }
})

watch(() => chatStore.selectedChannel, (newChan) => {
  const socket = gameStore.socket
  if (!socket || !newChan) return
  if (socket.connected) {
    socket.emit('join-channel', newChan.id)
  }
})

const initSocket = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket
  if (socket) {
    chatStore.initSocketListeners(socket)
    socket.emit('get-online-users')
    socket.on('connect', () => {
      if (chatStore.selectedChannel) {
        socket.emit('join-channel', chatStore.selectedChannel.id)
      }
    })
    if (chatStore.selectedChannel && socket.connected) {
        socket.emit('join-channel', chatStore.selectedChannel.id)
    }
  }
}

const sendMessage = () => {
  if (!chatStore.selectedChannel || !newMessage.value.trim()) return
  const payload = {
    channelId: chatStore.selectedChannel.id,
    content: newMessage.value,
    userId: userStore.currentUserId,
    username: userStore.user?.username || 'Unknown',
    token: userStore.token
  }
  gameStore.socket?.emit('send-message', payload)
  newMessage.value = ''
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const navigateTo = (tab: string) => {
  const routes: Record<string, string> = { 'chat': '/app', 'games': '/app/games', 'tournaments': '/app/tournaments', 'settings': '/app/settings', 'leaderboard': '/app/leaderboard' }
  router.push(routes[tab])
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}

const toggleVoiceChannel = async () => {
  if (voiceStore.isInVoice) {
    voiceStore.leaveVoice(gameStore.socket)
  } else if (chatStore.selectedChannel) {
    await voiceStore.joinVoice(chatStore.selectedChannel.id, gameStore.socket)
  }
}
</script>

<template>
  <div class="h-screen w-full flex bg-[#0f111a] text-slate-200 overflow-hidden font-sans antialiased selection:bg-primary/30">
    
    <!-- DESKTOP GUILD SIDEBAR -->
    <aside class="hidden md:flex w-16 flex-shrink-0 bg-[#090b11] border-r border-white/5 flex-col items-center py-4 gap-4 z-50">
      <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-2xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95" @click="router.push('/app')">
        🏠
      </div>
      <!-- Filter out any guild with ID 1 if it's the home nexus redundant icon -->
      <div v-for="guild in chatStore.guilds.filter(g => g.id !== 1)" :key="guild.id" @click="chatStore.selectedGuild = guild" class="w-12 h-12 rounded-3xl bg-slate-800 flex items-center justify-center font-black text-slate-400 cursor-pointer hover:rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-md group relative">
         <span class="z-10">{{ guild.name.charAt(0).toUpperCase() }}</span>
         <div v-if="chatStore.selectedGuild?.id === guild.id" class="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-8 bg-white rounded-r-full"></div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 h-full relative">
      <!-- HEADER -->
      <header class="h-14 flex items-center justify-between px-4 md:px-6 bg-[#111420]/80 backdrop-blur-md border-b border-white/5 z-20">
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = true" class="md:hidden p-2 text-slate-400 hover:text-white transition-all">☰</button>
          <div class="flex items-center gap-2">
            <span class="text-xl text-slate-600 hidden md:inline">#</span>
            <h2 class="text-sm font-black tracking-tight uppercase italic">{{ chatStore.selectedChannel?.name || 'general' }}</h2>
          </div>
          <nav class="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 ml-4">
            <button v-for="tab in ['chat', 'games', 'tournaments', 'leaderboard', 'settings']" :key="tab" @click="navigateTo(tab)" :class="cn('px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all', activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300')">
              {{ tab === 'settings' ? '⚙️' : (tab === 'leaderboard' ? '🏆' : tab) }}
            </button>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-600 border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer" @click="showUserMenu = !showUserMenu">
            {{ userStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <div class="flex-1 relative flex overflow-hidden">
        
        <!-- MOBILE SIDEBAR DRAWER -->
        <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"></div>
        <div :class="cn('md:hidden fixed inset-y-0 left-0 flex z-[70] transition-transform duration-300', isSidebarOpen ? 'translate-x-0' : '-translate-x-full')">
          <aside class="w-16 bg-[#090b11] border-r border-white/5 flex flex-col items-center py-4 gap-4">
             <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer" @click="router.push('/app'); isSidebarOpen = false">🏠</div>
             <div v-for="guild in chatStore.guilds.filter(g => g.id !== 1)" :key="guild.id" @click="chatStore.selectedGuild = guild" class="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400 cursor-pointer">
                {{ guild.name.charAt(0).toUpperCase() }}
             </div>
          </aside>
          <aside class="w-60 bg-[#0b0d14] flex flex-col p-4 shadow-2xl">
             <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Tactical Operations</h3>
             <nav class="flex flex-col gap-2 mb-8">
                <button v-for="tab in ['chat', 'games', 'tournaments', 'leaderboard', 'settings']" :key="tab" @click="navigateTo(tab); isSidebarOpen = false" :class="cn('flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black italic uppercase transition-all', activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-slate-500 bg-white/5')">
                   {{ tab === 'settings' ? '⚙️ settings' : (tab === 'leaderboard' ? '🏆 rankings' : tab) }}
                </button>
             </nav>
             <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">Channels</h4>
             <div class="space-y-1">
                <div v-for="channel in chatStore.channels" :key="channel.id" @click="chatStore.selectedChannel = channel; isSidebarOpen = false" class="px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/5 cursor-pointer uppercase italic">
                   # {{ channel.name }}
                </div>
             </div>
          </aside>
        </div>

        <!-- DESKTOP CHANNEL SIDEBAR -->
        <aside class="hidden md:flex w-60 flex-col bg-[#0b0d14] border-r border-white/5">
          <div class="flex-1 p-4 overflow-y-auto">
             <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2 italic">Intelligence Streams</h4>
             <div class="space-y-0.5">
                <div v-for="channel in chatStore.channels" :key="channel.id" @click="chatStore.selectedChannel = channel" :class="cn('px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer', chatStore.selectedChannel?.id === channel.id ? 'bg-white/10 text-white shadow-xl shadow-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')">
                   <span class="mr-2 text-slate-600 italic">#</span> {{ channel.name }}
                </div>
             </div>
          </div>
          <!-- Profile Badge -->
          <div class="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
             <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase">{{ userStore.user?.username?.charAt(0) }}</div>
                <div class="flex flex-col min-w-0">
                  <span class="text-[10px] font-black italic truncate uppercase">{{ userStore.user?.username }}</span>
                  <span class="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Combat Ready</span>
                </div>
             </div>
             <button class="p-1.5 hover:bg-white/10 rounded transition-all text-red-500 hover:text-red-400 font-bold" @click="logout" title="Disconnect Link">🔌</button>
          </div>
        </aside>

        <!-- MAIN VIEW -->
        <div class="flex-1 flex flex-col bg-[#0f111a] relative min-w-0">
           <div v-if="isChildRoute" class="absolute inset-0">
              <router-view />
           </div>
           
           <div v-else class="flex-1 flex flex-col animate-in fade-in duration-500">
              <!-- MESSAGES -->
              <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-4 custom-scrollbar">
                <div v-for="(msg, i) in chatStore.messages" :key="i" class="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all">
                  <div class="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex-shrink-0 flex items-center justify-center text-sm font-black text-slate-500">{{ msg.username.charAt(0).toUpperCase() }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 mb-1">
                      <span class="text-[11px] font-black italic uppercase text-primary tracking-tight">{{ msg.username }}</span>
                      <span class="text-[8px] text-slate-700 font-bold uppercase">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                    </div>
                    <p class="text-[13px] text-slate-300 leading-relaxed font-medium">{{ msg.content }}</p>
                  </div>
                </div>
              </div>

              <!-- INPUT -->
              <div class="p-4 md:p-6 pt-0">
                 <div :class="cn('flex items-center gap-3 bg-black/40 border p-2 md:p-3 rounded-2xl transition-all shadow-2xl shadow-black/50', !chatStore.selectedChannel ? 'border-red-500/20 opacity-80' : 'border-white/5 focus-within:border-primary/50')">
                    <input v-model="newMessage" @keyup.enter="sendMessage" type="text" :placeholder="chatStore.selectedChannel ? 'Broadcast transmission...' : '❌ STANDBY: SELECT CHANNEL'" class="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-700 h-10 px-2" :disabled="!chatStore.selectedChannel" />
                    <button @click="toggleVoiceChannel" :class="cn('p-2 rounded-xl transition-all', voiceStore.isInVoice ? 'bg-emerald-600/20 text-emerald-400 shadow-inner' : 'text-slate-400 hover:text-white')">
                       {{ voiceStore.isInVoice ? '🎙️' : '🔇' }}
                    </button>
                    <button @click="sendMessage" :disabled="!chatStore.selectedChannel || !newMessage.trim()" class="px-6 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 rounded-xl text-[10px] font-black italic uppercase shadow-xl transition-all active:scale-95 text-white">SEND</button>
                 </div>
              </div>
           </div>
        </div>

        <!-- MEMBER LIST SIDEBAR -->
        <aside class="hidden lg:flex w-64 bg-[#090b11] border-l border-white/5 p-6 flex-col overflow-y-auto">
           <h4 class="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-4 italic">Gaming Rooms — {{ chatStore.onlineUsers.length }}</h4>
           <div class="space-y-1">
              <div v-for="u in chatStore.onlineUsers" :key="u.id" class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group">
                <div class="relative">
                   <div class="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase text-slate-500 group-hover:text-white transition-colors">{{ u.username.charAt(0) }}</div>
                   <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090b11]"></div>
                </div>
                <span class="text-[11px] font-black italic uppercase truncate text-slate-400 group-hover:text-slate-200 transition-colors">{{ u.username }}</span>
              </div>
           </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
</style>
