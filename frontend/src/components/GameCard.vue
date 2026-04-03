<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  name: string
  description: string
  icon: string
  players: number
  status: 'active' | 'coming-soon' | 'beta' | 'new'
  statusText: string
}

defineProps<Props>()
defineEmits<{
  (e: 'launch'): void
}>()
</script>

<template>
  <div 
    @click="status !== 'coming-soon' ? $emit('launch') : null"
    :class="cn(
      'group relative overflow-hidden rounded-3xl bg-[#111420]/60 border border-white/5 transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer',
      status === 'coming-soon' && 'opacity-60 cursor-not-allowed grayscale'
    )"
  >
    <!-- Background Glow Effect (Hover) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

    <div class="p-6 relative z-10 flex flex-col h-full">
      <!-- Icon & Status -->
      <div class="flex justify-between items-start mb-6">
        <div class="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center text-3xl shadow-xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
          {{ icon }}
        </div>
        <div :class="cn(
          'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border',
          status === 'active' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
          status === 'beta' && 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          status === 'new' && 'bg-primary/10 border-primary/20 text-primary',
          status === 'coming-soon' && 'bg-slate-500/10 border-white/5 text-slate-500'
        )">
          {{ statusText }}
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <h4 class="text-xl font-black italic tracking-tighter text-white mb-2 uppercase">{{ name }}</h4>
        <p class="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2 uppercase tracking-wide">
          {{ description }}
        </p>
      </div>

      <!-- Meta Info -->
      <div class="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
           <div v-if="status !== 'coming-soon'" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
           <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">
             {{ status === 'coming-soon' ? 'Maintenance' : `${players} UNITS ACTIVE` }}
           </span>
        </div>
        
        <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
           <span class="text-xs text-primary">SELECT ARENA →</span>
        </div>
      </div>
    </div>

    <!-- Interactive Overlay for Active Games -->
    <div v-if="status !== 'coming-soon'" class="absolute inset-0 bg-primary/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
  </div>
</template>
