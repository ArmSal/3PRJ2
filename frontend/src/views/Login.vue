<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const success = ref('')

const handleSubmit = async () => {
  success.value = ''
  
  if (isLogin.value) {
    const ok = await userStore.login({ 
      username: username.value, 
      password: password.value 
    })
    if (ok) {
      success.value = 'CONNECTION ESTABLISHED. REDIRECTING...'
      setTimeout(() => router.push('/app'), 800)
    }
  } else {
    const ok = await userStore.register({ 
      username: username.value, 
      email: email.value, 
      password: password.value 
    })
    if (ok) {
      success.value = 'PROTOCOL INITIALIZED. PLEASE AUTHENTICATE.'
      setTimeout(() => {
        isLogin.value = true
        success.value = ''
      }, 2000)
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden font-sans selection:bg-primary/30">
    <!-- Matrix/Grid Overlay -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    
    <div class="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-700">
      <!-- Brand Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-3xl mb-6 shadow-2xl shadow-primary/20 animate-pulse">
          🎮
        </div>
        <h1 class="text-4xl font-black italic tracking-tighter text-white mb-2 uppercase">Gaming Plus</h1>
        <p class="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Neural Combat Network</p>
      </div>

      <!-- Auth Card -->
      <div class="glass-blur rounded-[32px] p-8 shadow-2xl relative">
        <div class="flex bg-black/40 p-1 rounded-2xl mb-8 border border-white/5 relative">
          <button 
            @click="isLogin = true"
            :class="cn(
              'flex-1 py-3 text-xs font-black italic uppercase transition-all rounded-xl relative z-10',
              isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )"
          >
            Authenticate
          </button>
          <button 
            @click="isLogin = false"
            :class="cn(
              'flex-1 py-3 text-xs font-black italic uppercase transition-all rounded-xl relative z-10',
              !isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            )"
          >
            Initialize
          </button>
          <!-- Animated Indicator -->
          <div 
             class="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-xl transition-all duration-300 shadow-lg shadow-primary/20"
             :style="{ left: isLogin ? '4px' : 'calc(50% + 2px)' }"
          ></div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="userStore.error" class="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <span>⚠️</span> {{ userStore.error }}
          </div>

          <div v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <span class="animate-bounce">✅</span> {{ success }}
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">👤</span>
              <input 
                v-model="username" 
                placeholder="OPERATOR_NAME"
                class="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-slate-800"
                required
                :disabled="userStore.loading"
              />
            </div>
          </div>

          <div class="space-y-2" v-if="!isLogin">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Mail Address</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">✉️</span>
              <input 
                v-model="email" 
                placeholder="protocol@network.com"
                type="email"
                class="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-slate-800"
                required
                :disabled="userStore.loading"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 transition-opacity">🔒</span>
              <input 
                v-model="password" 
                placeholder="••••••••"
                :type="showPassword ? 'text' : 'password'"
                class="w-full bg-black/40 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-slate-800"
                required
                :disabled="userStore.loading"
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform opacity-40 hover:opacity-100"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-2xl py-4 font-black italic uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
            :disabled="userStore.loading"
          >
            <span v-if="userStore.loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            <template v-else>
               {{ isLogin ? 'Establish Link' : 'Initialize Protocol' }}
               <span class="group-hover:translate-x-1 transition-transform">⚡</span>
            </template>
          </button>
        </form>

        <div class="mt-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="h-px flex-1 bg-white/5"></div>
            <span class="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">External Linkage</span>
            <div class="h-px flex-1 bg-white/5"></div>
          </div>
          <div class="flex gap-4 justify-center">
            <button class="w-12 h-12 glass-blur rounded-xl flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all border border-white/5">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" class="w-6 h-6" />
            </button>
            <button class="w-12 h-12 glass-blur rounded-xl flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all border border-white/5">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" class="w-6 h-6 invert" />
            </button>
          </div>
        </div>
      </div>

      <div class="text-center mt-10">
        <p class="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Global Gaming Protocol v2.4.0</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-blur {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
