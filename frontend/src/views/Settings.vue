<script setup lang="ts">
// frontend/src/views/Settings.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { cn } from '@/lib/utils'

const router = useRouter()
const userStore = useUserStore()

const newUsername = ref(userStore.user?.username || '')
const avatarPreview = ref(userStore.user?.avatar || '')
const saving = ref(false)
const feedback = ref<{ type: 'success' | 'error', msg: string } | null>(null)

// Convert file to base64 for simple avatar storage (MVP approach)
const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Limit file size to 2MB for MVP
  if (file.size > 2 * 1024 * 1024) {
    feedback.value = { type: 'error', msg: 'File exceeds 2MB limit.' }
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    avatarPreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

const saveProfile = async () => {
  saving.value = true
  feedback.value = null

  const payload: { username?: string, avatar?: string } = {}
  if (newUsername.value && newUsername.value !== userStore.user?.username) {
    payload.username = newUsername.value
  }
  if (avatarPreview.value && avatarPreview.value !== userStore.user?.avatar) {
    payload.avatar = avatarPreview.value
  }

  if (Object.keys(payload).length === 0) {
    feedback.value = { type: 'error', msg: 'No changes detected.' }
    saving.value = false
    return
  }

  const res = await userStore.updateProfile(payload)
  if (res.success) {
    feedback.value = { type: 'success', msg: 'Profile updated successfully.' }
  } else {
    feedback.value = { type: 'error', msg: res.error || 'Update failed.' }
  }
  saving.value = false
}

const initials = computed(() => userStore.user?.username?.charAt(0).toUpperCase() || '?')
</script>

<template>
  <div class="h-full w-full p-6 md:p-12 flex flex-col items-center overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
    <div class="w-full max-w-lg">

      <!-- Header -->
      <div class="mb-10">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
          <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Operator Profile</span>
        </div>
        <h2 class="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Settings</h2>
      </div>

      <!-- Card -->
      <div class="glass-blur rounded-[32px] border border-white/5 p-8 md:p-10 space-y-10">

        <!-- Avatar Section -->
        <div class="flex flex-col items-center gap-6">
          <div class="relative group cursor-pointer" @click="($refs.fileInput as HTMLInputElement)?.click()">
            <div v-if="avatarPreview" class="w-28 h-28 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl group-hover:border-primary/50 transition-all">
              <img :src="avatarPreview" alt="avatar" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-28 h-28 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl font-black text-white border-4 border-slate-800 shadow-2xl group-hover:border-primary/50 transition-all">
              {{ initials }}
            </div>
            <div class="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <span class="text-2xl">📷</span>
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
          <p class="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Click avatar to upload a new photo</p>
        </div>

        <div class="h-px bg-white/5"></div>

        <!-- Username Section -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Operator Callsign</label>
          <input v-model="newUsername" type="text" class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black italic uppercase text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700" placeholder="Enter new callsign..." />
        </div>

        <!-- Email (read-only) -->
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Registered Email</label>
          <div class="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 italic uppercase">
            {{ userStore.user?.email || 'classified@nexus.io' }}
          </div>
        </div>

        <!-- Feedback -->
        <div v-if="feedback" :class="cn('px-5 py-3 rounded-2xl text-xs font-black italic uppercase tracking-widest text-center', feedback.type === 'success' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-600/10 text-red-400 border border-red-500/20')">
          {{ feedback.msg }}
        </div>

        <!-- Save Button -->
        <button @click="saveProfile" :disabled="saving" class="w-full px-8 py-4 bg-primary text-white rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
          {{ saving ? 'SYNCHRONIZING...' : 'SAVE PROFILE ⚡' }}
        </button>
      </div>

      <!-- Danger Zone -->
      <div class="mt-10 glass-blur rounded-[32px] border border-red-500/10 p-8">
        <h3 class="text-xs font-black italic uppercase text-red-500 tracking-widest mb-4">Danger Zone</h3>
        <button @click="userStore.logout(); router.push('/login')" class="px-6 py-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black italic uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
          DISCONNECT NEURAL LINK 🔌
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>
