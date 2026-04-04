<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const stats = [
  { label: 'Active Units', value: '1,420+' },
  { label: 'Neural Matches', value: '12.8K' },
  { label: 'Lobby Latency', value: '14ms' },
]

const notifications = ref<any[]>([])

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/notifications')
    notifications.value = data
  } catch (e) {
    console.error('Failed to grab public broadcasts', e)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
    <!-- Matrix/Grid Overlay -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    
    <!-- Hero Glow -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>

    <!-- Navigation -->
    <nav class="h-20 flex items-center justify-between px-10 relative z-20 border-b border-white/5 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🎮</span>
        <h1 class="text-xl font-black italic tracking-tighter uppercase">Gaming Plus</h1>
      </div>
      <div class="hidden md:flex items-center gap-10">
        <a v-for="link in ['Network', 'Arenas', 'Bounties', 'Docs']" :key="link" href="#" class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all">
          {{ link }}
        </a>
      </div>
      <button @click="router.push('/login')" class="bg-primary/10 border border-primary/20 text-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10 active:scale-95">
        Terminal Access
      </button>
    </nav>

    <!-- Main Content -->
    <main class="relative z-10 pt-32 pb-20 px-10 flex flex-col items-center">
      <!-- Badge -->
      <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-10 group cursor-default">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">Neural Network Online</span>
      </div>
      
      <!-- Public Broadcast Ticker -->
      <div v-if="notifications.length > 0" class="w-full max-w-3xl bg-black/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md mb-12 flex items-center gap-4 overflow-hidden shadow-2xl">
         <div class="flex items-center gap-2 flex-shrink-0 pr-4 border-r border-white/10">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Global Broadcast</span>
         </div>
         <div class="flex-1 overflow-hidden relative" style="mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);">
            <div class="flex items-center gap-8 animate-marquee whitespace-nowrap">
               <div v-for="n in notifications.slice(0,3)" :key="n.id" class="flex items-center gap-3">
                  <span class="text-xs font-black italic uppercase text-white">{{ n.title }}:</span>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ n.content }}</span>
               </div>
               <!-- Duplicated for seamless loop -->
               <div v-for="n in notifications.slice(0,3)" :key="n.id + '_copy'" class="flex items-center gap-3">
                  <span class="text-xs font-black italic uppercase text-white">{{ n.title }}:</span>
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ n.content }}</span>
               </div>
            </div>
         </div>
      </div>

      <!-- Hero Title -->
      <h2 class="text-5xl md:text-8xl font-black italic tracking-tighter text-center mb-8 max-w-5xl leading-[0.9] uppercase bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
        The Future Of <br /> Cybernetic Combat
      </h2>

      <!-- Subtitle -->
      <p class="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs text-center max-w-2xl mb-14 leading-relaxed">
        High-fidelity social chat integrated with distributed neural game engines. <br /> Zero latency. Infinite competition.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row items-center gap-6 mb-20">
        <button @click="router.push('/login')" class="w-64 h-16 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group">
          START ENGAGEMENT
          <span class="group-hover:translate-x-1 transition-transform">⚡</span>
        </button>
        <button class="w-64 h-16 bg-white/5 border border-white/10 text-slate-300 rounded-2xl font-black italic uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-95">
          REVIEW INTEL
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl p-8 rounded-[40px] bg-black/40 border border-white/5 backdrop-blur-xl mb-32">
        <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center gap-1 group">
           <span class="text-4xl font-black italic text-white group-hover:text-primary transition-colors">{{ stat.value }}</span>
           <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="text-center">
        <p class="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] mb-4">Secured by GGP Multi-Core Protocol</p>
        <div class="flex gap-4 justify-center opacity-20 grayscale hover:opacity-100 transition-all duration-700">
           <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" class="w-6 h-6" />
           <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" class="w-6 h-6" />
           <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" class="w-6 h-6" />
           <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" class="w-6 h-6" />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Custom animations for the professional board look */
@keyframes pulse-soft {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
  width: max-content;
}
</style>
