<script setup lang="ts">
// NO SCRIPT LOGIC NEEDED IN ROOT APP COMPONENT FOR THIS PROFESSIONAL ARCHITECTURE
</script>

<template>
  <!-- NEURAL ROOT CONTAINER -->
  <div class="min-h-screen w-full bg-[#0a0a0f] text-slate-200 font-sans selection:bg-primary/30">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* PROFESSIONAL GLOBAL PROTOCOLS */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --primary: #5865f2; /* Professional Discord-Indigo */
}

body {
  margin: 0;
  padding: 0;
  background-color: #0a0a0f;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Neural View Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Global Custom Utilities for High-Fidelity HUDs */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}
</style>
