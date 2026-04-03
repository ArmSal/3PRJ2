<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script>
export default { name: 'App' }
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --primary: #5865f2;
  --primary-hover: #4752c4;
  --secondary: #3ba55d;
  --danger: #ed4245;
  --warning: #f9a825;
  --bg-dark: #0a0a0f;
  --bg-card: rgba(20, 20, 30, 0.8);
  --bg-glass: rgba(255, 255, 255, 0.05);
  --border-glass: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: #b9bbbe;
  --neon-blue: #00d4ff;
  --neon-pink: #ff006e;
  --neon-green: #00ff88;
  --gradient-1: #1a1a2e;
  --gradient-2: #16213e;
  --gradient-3: #0f3460;
  --gradient-4: #e94560;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(-45deg, var(--gradient-1), var(--gradient-2), var(--gradient-3), var(--gradient-4));
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Glassmorphism Card */
.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Neon Glow Effects */
.neon-text {
  text-shadow: 0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue), 0 0 40px var(--neon-blue);
}

.neon-border {
  box-shadow: 0 0 5px var(--neon-blue), inset 0 0 5px var(--neon-blue);
}

/* Buttons */
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4);
}

.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: 0.5s;
}

.btn-primary:hover::after {
  left: 100%;
}

.btn-secondary {
  padding: 12px 24px;
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border-glass);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--neon-blue);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

/* Inputs */
.input-modern {
  padding: 14px 18px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--border-glass);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.3s ease;
  width: 100%;
}

.input-modern:focus {
  outline: none;
  border-color: var(--neon-blue);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

.input-modern::placeholder {
  color: var(--text-secondary);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-hover);
}

/* Loading Animation */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-glass);
  border-top-color: var(--neon-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Pulse Animation */
.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Floating particles (decorative) */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: -1;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--neon-blue);
  border-radius: 50%;
  opacity: 0.3;
  animation: float 15s infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
