<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { cn } from '@/lib/utils'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const stats = ref<{ totalUsers: number, totalTournaments: number, totalNotifications: number }>({
  totalUsers: 0,
  totalTournaments: 0,
  totalNotifications: 0
})

const notifications = ref<any[]>([])
const newNotif = ref({ title: '', content: '', type: 'info' })

const newTournament = ref({
  name: '',
  description: '',
  gameType: 'pong',
  maxParticipants: 16,
  campus1: 'Paris-Nexus',
  campus2: 'Lyon-Matrix',
  startsAt: new Date().toISOString().slice(0, 16)
})

const fetchDashboard = async () => {
  if (!userStore.isAdmin) {
    router.push('/app')
    return
  }
  try {
    const [statsRes, notifRes] = await Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/notifications')
    ])
    stats.value = statsRes.data
    notifications.value = notifRes.data
  } catch (e) {
    console.error('Failed to load admin context', e)
  } finally {
    loading.value = false
  }
}

const createNotification = async () => {
  if (!newNotif.value.title || !newNotif.value.content) return
  try {
    await axios.post('/api/admin/notifications', newNotif.value)
    newNotif.value = { title: '', content: '', type: 'info' }
    await fetchDashboard()
  } catch (e) {
    console.error(e)
  }
}

const deleteNotification = async (id: number) => {
  try {
    await axios.delete(`/api/admin/notifications/${id}`)
    await fetchDashboard()
  } catch (e) {
    console.error(e)
  }
}

const createTournament = async () => {
  if (!newTournament.value.name) return
  try {
    await axios.post('/api/admin/tournaments', newTournament.value)
    newTournament.value.name = ''
    newTournament.value.description = ''
    alert('Tournament Initialization Protocol dispatched successfully.')
    await fetchDashboard()
  } catch (e) {
    alert('System Error: Could not initialize tournament.')
  }
}

onMounted(() => {
  if (!userStore.isAdmin) {
    router.push('/app')
  } else {
    fetchDashboard()
  }
})
</script>

<template>
  <div class="h-full w-full p-6 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
    <div v-if="loading" class="flex h-full items-center justify-center">
      <div class="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
    </div>
    
    <div v-else class="max-w-6xl mx-auto space-y-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 italic">Level 5 Clearance</span>
          </div>
          <h2 class="text-3xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none">Administration</h2>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-blur rounded-3xl border border-red-500/20 p-8 flex flex-col">
          <span class="text-5xl mb-4">👥</span>
          <span class="text-4xl font-black text-white italic">{{ stats.totalUsers }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Registered Units</span>
        </div>
        <div class="glass-blur rounded-3xl border border-red-500/20 p-8 flex flex-col">
          <span class="text-5xl mb-4">🏆</span>
          <span class="text-4xl font-black text-white italic">{{ stats.totalTournaments }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Tactical Brackets</span>
        </div>
        <div class="glass-blur rounded-3xl border border-red-500/20 p-8 flex flex-col">
          <span class="text-5xl mb-4">📢</span>
          <span class="text-4xl font-black text-white italic">{{ stats.totalNotifications }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Active Broadcasts</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Tournament Control -->
        <div class="glass-blur rounded-[32px] border border-white/5 p-8">
          <h3 class="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4">Initialize Official Tournament</h3>
          <div class="space-y-4">
             <input v-model="newTournament.name" type="text" placeholder="Tournament Sequence Name" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-red-500 transition-all text-white" />
             <textarea v-model="newTournament.description" placeholder="Operational Parameters (Briefing)" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:border-red-500 transition-all h-24 resize-none text-white"></textarea>
             
             <div class="grid grid-cols-2 gap-4">
                <select v-model="newTournament.gameType" class="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none text-white">
                  <option value="pong">Pong</option>
                  <option value="snake">Snake</option>
                  <option value="chess">Chess</option>
                  <option value="trivia">Trivia</option>
                  <option value="ttt">Tic Tac Toe</option>
                </select>
                <select v-model="newTournament.maxParticipants" class="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none text-white">
                  <option :value="8">8 Units</option>
                  <option :value="16">16 Units</option>
                  <option :value="32">32 Units</option>
                </select>
             </div>
             
             <div class="grid grid-cols-2 gap-4">
                <input v-model="newTournament.campus1" type="text" placeholder="Campus Alpha" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-red-500 text-white" />
                <input v-model="newTournament.campus2" type="text" placeholder="Campus Beta" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-red-500 text-white" />
             </div>
             
             <input v-model="newTournament.startsAt" type="datetime-local" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-red-500 text-white uppercase italic" />

             <button @click="createTournament" :disabled="!newTournament.name" class="w-full py-4 mt-4 bg-red-600 text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50">
               EXECUTE PROTOCOL
             </button>
          </div>
        </div>

        <!-- Global Notifications -->
        <div class="glass-blur rounded-[32px] border border-white/5 p-8 flex flex-col">
          <h3 class="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4">Global Broadcast System</h3>
          
          <div class="space-y-4 mb-8">
             <input v-model="newNotif.title" type="text" placeholder="Alert Header" class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-amber-500 text-white" />
             <textarea v-model="newNotif.content" placeholder="Transmission payload..." class="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-medium outline-none focus:border-amber-500 h-24 resize-none text-white"></textarea>
             <div class="flex gap-4">
                <select v-model="newNotif.type" class="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-black uppercase tracking-widest outline-none text-white">
                  <option value="info">Intelligence (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="alert">Critical (Red)</option>
                </select>
                <button @click="createNotification" :disabled="!newNotif.title || !newNotif.content" class="px-8 bg-amber-500 text-black rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50">
                  BROADCAST
                </button>
             </div>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
             <div v-for="n in notifications" :key="n.id" class="p-4 rounded-2xl bg-black/20 border border-white/5 relative group">
                <div class="flex items-center gap-2 mb-2">
                   <div :class="cn('w-2 h-2 rounded-full', n.type === 'alert' ? 'bg-red-500' : (n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'))"></div>
                   <h4 class="text-sm font-black italic text-white uppercase">{{ n.title }}</h4>
                </div>
                <p class="text-xs text-slate-400 font-medium break-words">{{ n.content }}</p>
                <button @click="deleteNotification(n.id)" class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all font-black text-lg">×</button>
             </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>
