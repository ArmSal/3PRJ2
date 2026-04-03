<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { useGameStore } from '@/stores/game'
import { useVoiceStore } from '@/stores/voice'
import { cn } from '@/lib/utils'
import type { Message, User, Guild } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()
const gameStore = useGameStore()
const voiceStore = useVoiceStore()

const messagesContainer = ref<HTMLElement | null>(null)
const newMessage = ref('')
const showUserMenu = ref(false)
const typingTimeout = ref<number | null>(null)

const isChildRoute = computed(() => route.path !== '/app' && route.path !== '/app/')
const activeTab = computed(() => {
  const path = route.path
  if (path.includes('/games') || path.includes('/pong') || path.includes('/snake') || path.includes('/trivia')) return 'games'
  if (path.includes('/tournaments')) return 'tournaments'
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

// Reactively fetch channels when guild changes
watch(() => chatStore.selectedGuild, async (newGuild) => {
  if (newGuild) {
    await chatStore.fetchChannels(newGuild.id)
  }
})

// Manage socket room joining when channel changes
watch(() => chatStore.selectedChannel, (newChan, oldChan) => {
  const socket = gameStore.socket
  if (!socket || !newChan) return
  
  if (oldChan) {
    // Leave logic could be added here if needed
  }
  
  // Only emit if socket is actually connected
  if (socket.connected) {
    socket.emit('join-channel', newChan.id)
    console.log('📡 JOINED CHANNEL:', newChan.id);
  }
})

const initSocket = () => {
  gameStore.initSocket(userStore.token)
  const socket = gameStore.socket

  if (socket) {
    console.log('🔗 SYNCING NEURAL SOCKET...');
    chatStore.initSocketListeners(socket)
    socket.emit('get-online-users')
    
    // Join selected channel when socket connects (handles race condition)
    socket.on('connect', () => {
      if (chatStore.selectedChannel) {
        console.log('📡 SOCKET RECONNECTED - JOINING CHANNEL:', chatStore.selectedChannel.id);
        socket.emit('join-channel', chatStore.selectedChannel.id)
      }
    })
    
    // Join the initial channel if present and socket is already connected
    if (chatStore.selectedChannel && socket.connected) {
        console.log('📡 JOINING INITIAL CHANNEL:', chatStore.selectedChannel.id);
        socket.emit('join-channel', chatStore.selectedChannel.id)
    }
  } else {
    console.warn('❌ SOCKET NOT FOUND: Check VITE_API_URL');
  }
}

const sendMessage = () => {
  console.log('⚡ STARTING TRANSMISSION ATTEMPT...');
  if (!newMessage.value.trim() || !chatStore.selectedChannel) {
    console.warn('🛑 TRANSMISSION ABORTED: Empty message or no channel selected.', { msg: newMessage.value, channel: chatStore.selectedChannel });
    return
  }
  
  const payload: any = {
    channelId: chatStore.selectedChannel.id,
    content: newMessage.value,
    userId: userStore.currentUserId as number,
    username: userStore.user?.username || 'Unknown',
    token: userStore.token // Critical fail-safe for server-side identity recovery
  }
  
  gameStore.socket?.emit('send-message', payload)
  console.log('📡 TRANSMISSION EMITTED:', payload);
  
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
  const routes: Record<string, string> = { 'chat': '/app', 'games': '/app/games', 'tournaments': '/app/tournaments' }
  router.push(routes[tab])
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}

const toggleVoiceChannel = async () => {
  if (voiceStore.isInVoice) {
    voiceStore.leaveVoice(gameStore.socket)
  } else {
    if (chatStore.selectedChannel) {
      await voiceStore.joinVoice(chatStore.selectedChannel.id, gameStore.socket)
    }
  }
}
</script>

<template>
  <div class="h-screen w-full flex bg-[#0f111a] text-slate-200 overflow-hidden font-sans antialiased selection:bg-primary/30">
    
    <!-- LEFT SIDEBAR: GUILDS -->
    <aside class="w-[72px] flex flex-col items-center py-4 gap-3 bg-[#090b11] border-r border-white/5">
      <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-2xl shadow-lg shadow-primary/20 cursor-pointer active:scale-90 transition-all">
        🎮
      </div>
      <div class="w-8 h-[2px] bg-white/5 my-1"></div>
      
      <div class="flex-1 flex flex-col items-center gap-3 w-full custom-scrollbar overflow-y-auto">
        <div 
          v-for="guild in chatStore.guilds" 
          :key="guild.id"
          class="relative group"
          @click="chatStore.selectedGuild = guild"
        >
          <div :class="cn(
            'w-12 h-12 rounded-3xl bg-slate-800 flex items-center justify-center font-black text-slate-400 cursor-pointer transition-all duration-300 group-hover:rounded-2xl group-hover:bg-indigo-600 group-hover:text-white',
            chatStore.selectedGuild?.id === guild.id && 'rounded-2xl bg-indigo-600 text-white'
          )">
            {{ guild.name.charAt(0).toUpperCase() }}
          </div>
          <div v-if="chatStore.selectedGuild?.id === guild.id" class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-white rounded-r-full"></div>
        </div>
      </div>
      
      <div class="w-12 h-12 rounded-3xl bg-slate-800 flex items-center justify-center text-xl text-emerald-500 cursor-pointer hover:rounded-2xl hover:bg-emerald-600 hover:text-white transition-all">
        +
      </div>
    </aside>

    <!-- CENTER CONTENT -->
    <main class="flex-1 flex flex-col min-w-0 h-full relative">
      
      <!-- TOP NAVIGATION BAR -->
      <header class="h-14 flex items-center justify-between px-6 bg-[#111420]/80 backdrop-blur-md border-b border-white/5 z-20">
        <div class="flex items-center gap-8">
           <div class="flex items-center gap-2">
              <span class="text-2xl text-slate-600">#</span>
              <h2 class="text-sm font-black tracking-tight uppercase italic">{{ chatStore.selectedChannel?.name || 'general' }}</h2>
           </div>
           
           <nav class="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
              <button 
                v-for="tab in ['chat', 'games', 'tournaments']" 
                :key="tab"
                @click="navigateTo(tab)"
                :class="cn(
                  'px-4 py-1.5 rounded-lg text-xs font-black italic transition-all flex items-center gap-2',
                  activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
                )"
              >
                <span v-if="tab === 'chat'">💬</span>
                <span v-if="tab === 'games'">🎮</span>
                <span v-if="tab === 'tournaments'">🏆</span>
                <span class="uppercase tracking-tighter">{{ tab }}</span>
              </button>
           </nav>
        </div>

        <div class="flex items-center gap-4">
           <div class="relative hidden lg:block">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs text-xs">🔍</span>
              <input type="text" placeholder="Search Intel..." class="bg-black/40 border border-white/5 rounded-full py-1.5 pl-9 pr-6 text-xs w-48 focus:w-64 focus:border-primary transition-all outline-none" />
           </div>
           
           <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-indigo-600 border border-white/10 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-lg" @click="showUserMenu = !showUserMenu">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
           </div>
        </div>
      </header>

      <!-- VIEWPORT -->
      <div class="flex-1 relative min-h-0">
        <!-- APP VIEWS -->
        <div v-if="isChildRoute" class="absolute inset-0 overflow-hidden">
           <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                 <component :is="Component" />
              </transition>
           </router-view>
        </div>

        <!-- DEFAULT CHAT VIEW -->
        <div v-else class="flex h-full">
           <!-- LEFT CONTEXT SIDEBAR -->
           <aside class="w-60 flex flex-col bg-[#0b0d14] border-r border-white/5">
              <div class="flex-1 px-3 py-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                 <div class="section">
                    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                       Text Channels
                       <span class="text-lg font-light cursor-pointer">+</span>
                    </h4>
                    <div class="space-y-0.5">
                       <div 
                         v-for="channel in chatStore.channels" 
                         :key="channel.id"
                         @click="chatStore.selectedChannel = channel"
                         :class="cn(
                           'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                           chatStore.selectedChannel?.id === channel.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                         )"
                       >
                          <span class="text-xl text-slate-600">#</span>
                          <span class="text-xs font-bold uppercase tracking-tight">{{ channel.name }}</span>
                       </div>
                    </div>
                 </div>

                 <div class="section">
                    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                       Voice Comms
                       <span v-if="voiceStore.voiceUsers.length > 0" class="text-[10px] text-emerald-500 font-bold">{{ voiceStore.voiceUsers.length + 1 }} connected</span>
                    </h4>
                    <div 
                       @click="toggleVoiceChannel"
                       :class="cn(
                         'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                         voiceStore.isInVoice ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-500 hover:text-slate-300'
                       )"
                    >
                       <span class="text-lg" :class="voiceStore.isInVoice ? 'animate-pulse' : 'opacity-50'">
                         {{ voiceStore.isInVoice ? '🔊' : '🔇' }}
                       </span>
                       <span class="text-xs font-bold uppercase tracking-tight">
                         {{ voiceStore.isInVoice ? 'Voice Active' : 'Join Voice' }}
                       </span>
                       <span v-if="voiceStore.isInVoice" class="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <!-- Voice Users -->
                    <div v-if="voiceStore.isInVoice && voiceStore.voiceUsers.length > 0" class="mt-2 space-y-1">
                       <div v-for="userId in voiceStore.voiceUsers" :key="userId" class="flex items-center gap-2 px-3 py-1 text-[10px] text-slate-400">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>User {{ userId.slice(0, 6) }}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <!-- USER PANEL -->
              <div class="p-3 bg-black/40 border-t border-white/5">
                 <div class="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 transition-all">
                    <div class="flex items-center gap-2">
                       <div class="relative">
                          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase">{{ userStore.user?.username?.charAt(0) }}</div>
                          <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b0d14]"></div>
                       </div>
                       <div class="flex flex-col min-w-0">
                          <span class="text-[11px] font-black italic truncate uppercase leading-none">{{ userStore.user?.username }}</span>
                          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Connected</span>
                       </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                       <button 
                         v-if="voiceStore.isInVoice"
                         @click="voiceStore.toggleMute()"
                         :class="cn('p-1 hover:bg-white/10 rounded transition-all', voiceStore.isMuted ? 'text-red-500' : 'text-emerald-500')"
                       >
                         {{ voiceStore.isMuted ? '🔇' : '🎤' }}
                       </button>
                       <button class="p-1 hover:bg-white/10 rounded" @click="logout">🚪</button>
                    </div>
                 </div>
              </div>
           </aside>

           <!-- MAIN CHAT AREA -->
           <div class="flex-1 flex flex-col bg-[#0f111a] relative">
              <div ref="messagesContainer" class="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 custom-scrollbar">
                 <div v-for="(msg, i) in chatStore.messages" :key="i" 
                    class="group flex gap-4 p-2 rounded-xl hover:bg-white/5 transition-all animate-in fade-in slide-in-from-bottom-1 duration-300"
                 >
                    <div class="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center text-sm font-black border border-white/5 group-hover:border-primary/50 transition-all">
                       {{ msg.username.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1 min-w-0">
                       <div class="flex items-baseline gap-2 mb-1">
                          <span class="text-xs font-black italic uppercase text-primary">{{ msg.username }}</span>
                          <span class="text-[9px] text-slate-600 font-bold uppercase">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                       </div>
                       <p class="text-sm text-slate-300 leading-relaxed">{{ msg.content }}</p>
                    </div>
                 </div>
              </div>

              <!-- INPUT -->
              <div class="p-6 pt-0">
                 <div class="flex items-center gap-3 bg-black/40 border border-white/5 p-3 rounded-2xl focus-within:border-primary/50 transition-all shadow-2xl">
                    <button class="p-2 hover:bg-white/5 rounded-xl text-xl opacity-50 hover:opacity-100 transition-all">➕</button>
                    <input 
                      v-model="newMessage"
                      @keyup.enter="sendMessage"
                      type="text" 
                      placeholder="Transmission Intel..." 
                      class="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-700" 
                    />
                    <button 
                      @click="toggleVoiceChannel"
                      :class="cn(
                        'px-4 py-2 rounded-xl text-[10px] font-black italic tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2',
                        voiceStore.isInVoice 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      )"
                    >
                      {{ voiceStore.isInVoice ? '🔊 VOICE ON' : '🎙️ JOIN VOICE' }}
                    </button>
                    <button @click="sendMessage" class="px-6 py-2 bg-primary hover:bg-primary/80 rounded-xl text-[10px] font-black italic tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
                       SEND <span>⚡</span>
                    </button>
                 </div>
              </div>
           </div>

           <!-- RIGHT MEMBER LIST -->
           <aside class="w-60 hidden xl:flex flex-col bg-[#0b0d14] border-l border-white/5 p-4 overflow-y-auto custom-scrollbar">
              <h4 class="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 mb-4">Tactical Units — {{ chatStore.onlineUsers.length }}</h4>
              <div class="space-y-1">
                 <div v-for="u in chatStore.onlineUsers" :key="u.id" class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 group cursor-pointer transition-all">
                    <div class="relative">
                       <div class="w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase text-slate-400 group-hover:text-white transition-all">{{ u.username.charAt(0) }}</div>
                       <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b0d14]"></div>
                    </div>
                    <div class="flex flex-col min-w-0">
                       <span class="text-[11px] font-black italic truncate uppercase">{{ u.username }}</span>
                       <span class="text-[8px] text-slate-600 font-black uppercase tracking-tighter leading-none">In Combat</span>
                    </div>
                 </div>
              </div>
           </aside>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
