<template>
  <div class="login-container">
    <!-- Floating Particles Background -->
    <div class="particles">
      <div class="particle" v-for="n in 20" :key="n" :style="getParticleStyle(n)"></div>
    </div>
    
    <div class="login-wrapper">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-icon">🎮</div>
        <h1 class="logo-text neon-text">Gaming Plus</h1>
        <p class="tagline">Connect. Play. Compete.</p>
      </div>

      <!-- Auth Card -->
      <div class="auth-card glass-card">
        <div class="auth-tabs">
          <button 
            :class="['tab-btn', { active: isLogin }]" 
            @click="isLogin = true"
          >
            Login
          </button>
          <button 
            :class="['tab-btn', { active: !isLogin }]" 
            @click="isLogin = false"
          >
            Register
          </button>
          <div class="tab-indicator" :style="{ left: isLogin ? '0%' : '50%' }"></div>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <!-- Error Message -->
          <div v-if="error" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="success-message">
            <span class="success-icon">✅</span>
            {{ success }}
          </div>

          <div class="input-group">
            <label>Username</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                v-model="username" 
                placeholder="Enter your username"
                class="input-modern"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="input-group" v-if="!isLogin">
            <label>Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input 
                v-model="email" 
                placeholder="Enter your email"
                type="email"
                class="input-modern"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                v-model="password" 
                placeholder="Enter your password"
                :type="showPassword ? 'text' : 'password'"
                class="input-modern"
                required
                :disabled="loading"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn-primary submit-btn"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner-small"></span>
            <span v-else>{{ isLogin ? 'Login' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Social Login (Future) -->
        <div class="social-section">
          <div class="divider">
            <span>or continue with</span>
          </div>
          <div class="social-buttons">
            <button class="social-btn" title="Google (Coming Soon)">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" />
            </button>
            <button class="social-btn" title="Discord (Coming Soon)">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/discordjs/discordjs-original.svg" alt="Discord" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="login-footer">
        <p>By continuing, you agree to our Terms of Service</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      isLogin: true,
      username: '',
      email: '',
      password: '',
      showPassword: false,
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    getParticleStyle(n) {
      return {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }
    },
    async handleSubmit() {
      this.error = ''
      this.success = ''
      this.loading = true
      
      const endpoint = this.isLogin ? '/login' : '/register'
      const payload = this.isLogin 
        ? { username: this.username, password: this.password }
        : { username: this.username, email: this.email, password: this.password }
      
      try {
        const { data } = await axios.post(endpoint, payload)
        if (this.isLogin) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          this.success = 'Login successful! Redirecting...'
          setTimeout(() => this.$router.push('/chat'), 500)
        } else {
          this.success = 'Account created! Please login.'
          setTimeout(() => {
            this.isLogin = true
            this.success = ''
          }, 1500)
        }
      } catch (e) {
        this.error = e.response?.data?.error || 'Connection failed. Please try again.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
  z-index: 1;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float-icon 3s ease-in-out infinite;
}

@keyframes float-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-text {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-card {
  padding: 32px;
}

.auth-tabs {
  display: flex;
  position: relative;
  margin-bottom: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.tab-btn.active {
  color: var(--text-primary);
}

.tab-indicator {
  position: absolute;
  top: 4px;
  left: 0;
  width: 50%;
  height: calc(100% - 8px);
  background: var(--primary);
  border-radius: 10px;
  transition: left 0.3s ease;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 16px;
  z-index: 1;
}

.input-wrapper .input-modern {
  padding-left: 42px;
}

.toggle-password {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn {
  margin-top: 8px;
  padding: 14px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
}

.error-message {
  background: rgba(237, 66, 69, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
}

.success-message {
  background: rgba(59, 165, 93, 0.1);
  border: 1px solid var(--secondary);
  color: var(--secondary);
}

.social-section {
  margin-top: 24px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-glass);
}

.divider span {
  color: var(--text-secondary);
  font-size: 13px;
}

.social-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover {
  border-color: var(--neon-blue);
  transform: translateY(-2px);
}

.social-btn img {
  width: 24px;
  height: 24px;
  filter: brightness(0.9);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 12px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px;
  }
  
  .logo-text {
    font-size: 24px;
  }
}
</style>
