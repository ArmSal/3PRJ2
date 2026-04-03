<template>
  <div class="landing-page">
    <div class="particles">
      <div class="particle" v-for="n in 30" :key="n" :style="getParticleStyle(n)"></div>
    </div>
    
    <nav class="navbar glass-nav">
      <div class="nav-brand">
        <span class="logo-icon">🎮</span>
        <span class="logo-text neon-text">Discord-Gaming Plus</span>
      </div>
      <div class="nav-links">
        <button class="btn-outline" @click="$router.push('/login')">Log In</button>
        <button class="btn-primary" @click="$router.push('/login')">Sign Up</button>
      </div>
    </nav>

    <main class="hero-section">
      <div class="hero-content text-center">
        <h1 class="hero-title">
          The Ultimate <span class="highlight">Social Gaming</span> Experience
        </h1>
        <p class="hero-subtitle">
          Connect with friends across campuses. Play integrated browser games. Compete in tournaments. Talk in real-time with WebRTC voice.
        </p>
        <div class="cta-group">
          <button class="btn-huge btn-primary glow-effect" @click="$router.push('/login')">
            Launch App
          </button>
          <a href="#features" class="btn-learn-more">Explore Features</a>
        </div>
      </div>
      
      <div class="hero-visual">
        <div class="app-mockup glass-card glow-blue">
          <div class="mockup-sidebar"></div>
          <div class="mockup-content">
            <div class="mockup-header"></div>
            <div class="mockup-messages">
              <div class="m-msg m-left"></div>
              <div class="m-msg m-right"></div>
              <div class="m-msg m-left"></div>
            </div>
          </div>
          <div class="mockup-game">
            <div class="m-game-box"></div>
          </div>
        </div>
      </div>
    </main>

    <section id="features" class="features-section">
      <div class="feature-grid">
        <div class="feature-card glass-card">
          <div class="icon">🎙️</div>
          <h3>Real-time Communication</h3>
          <p>Crystal clear voice chat using WebRTC and instant text messaging via Socket.io.</p>
        </div>
        <div class="feature-card glass-card">
          <div class="icon">🕹️</div>
          <h3>Integrated Mini-Games</h3>
          <p>Challenge friends instantly to classic games like Pong, Snake, and Trivia directly inside the chat.</p>
        </div>
        <div class="feature-card glass-card">
          <div class="icon">🏆</div>
          <h3>Inter-Campus Tournaments</h3>
          <p>Participate in official multi-campus competitions. Represent your school, win big.</p>
        </div>
        <div class="feature-card glass-card">
          <div class="icon">👁️</div>
          <h3>Spectator Mode</h3>
          <p>Don't want to play? Hop in and watch your friends' critical matches live.</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>© 2026 École IT Hackathon - B3PRJ2 Cloud-Native Social App</p>
    </footer>
  </div>
</template>

<script>
export default {
  methods: {
    getParticleStyle(n) {
      return {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 15}s`,
        animationDuration: `${10 + Math.random() * 15}s`,
        opacity: Math.random() * 0.5 + 0.2,
        width: `${Math.random() * 6 + 2}px`,
        height: `${Math.random() * 6 + 2}px`,
      }
    }
  }
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  color: #fff;
}

.glass-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 5%;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
}

.logo-text {
  background: linear-gradient(135deg, var(--neon-blue), var(--neon-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 16px;
}

.btn-outline {
  padding: 10px 24px;
  border: 2px solid rgba(255,255,255,0.2);
  background: transparent;
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.btn-outline:hover {
  border-color: var(--neon-blue);
  box-shadow: 0 0 15px rgba(0,212,255,0.2);
}

.btn-primary {
  padding: 10px 24px;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 5%;
  flex: 1;
}

.hero-content {
  max-width: 800px;
  margin-bottom: 60px;
}

.hero-title {
  font-size: 64px;
  line-height: 1.1;
  font-weight: 800;
  margin-bottom: 24px;
}

.highlight {
  color: var(--neon-green);
  text-shadow: 0 0 20px rgba(0,255,136,0.4);
}

.hero-subtitle {
  font-size: 20px;
  color: var(--text-secondary);
  margin-bottom: 40px;
  line-height: 1.6;
}

.cta-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.btn-huge {
  font-size: 20px;
  padding: 18px 40px;
  border-radius: 16px;
}

.glow-effect {
  box-shadow: 0 0 30px rgba(255,0,110,0.4);
}

.btn-learn-more {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  font-size: 18px;
  border-bottom: 2px solid transparent;
  transition: 0.3s;
}
.btn-learn-more:hover {
  border-color: var(--neon-blue);
  color: var(--neon-blue);
}

.hero-visual {
  width: 100%;
  max-width: 1000px;
  perspective: 1000px;
}

.app-mockup {
  display: flex;
  height: 500px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(10,10,15,0.8);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(0,212,255,0.1);
  transform: rotateX(5deg) scale(0.95);
  transition: transform 0.5s;
  overflow: hidden;
}
.app-mockup:hover {
  transform: rotateX(0) scale(1);
}

.mockup-sidebar {
  width: 80px;
  background: rgba(0,0,0,0.5);
  border-right: 1px solid rgba(255,255,255,0.1);
}
.mockup-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.mockup-header {
  height: 60px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.mockup-messages {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.m-msg { height: 40px; border-radius: 8px; }
.m-left { width: 60%; background: rgba(255,255,255,0.1); }
.m-right { width: 40%; background: rgba(88,101,242,0.3); align-self: flex-end; }
.mockup-game {
  width: 300px;
  border-left: 1px solid rgba(255,255,255,0.1);
  background: rgba(20,20,30,0.8);
  padding: 20px;
}
.m-game-box {
  width: 100%;
  height: 150px;
  background: rgba(255,0,110,0.2);
  border-radius: 12px;
}

.features-section {
  padding: 80px 5%;
  background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.5));
}

.feature-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
}

.feature-card {
  padding: 40px 30px;
  text-align: center;
  transition: 0.3s;
}
.feature-card:hover {
  transform: translateY(-10px);
  border-color: var(--neon-blue);
}

.icon {
  font-size: 48px;
  margin-bottom: 20px;
}
.feature-card h3 {
  font-size: 22px;
  margin-bottom: 16px;
  font-weight: 700;
}
.feature-card p {
  color: var(--text-secondary);
  line-height: 1.5;
}

.footer {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: auto;
}

@media (max-width: 768px) {
  .hero-title { font-size: 40px; }
  .app-mockup { flex-direction: column; height: 600px; }
  .mockup-game { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.1); height: 200px; }
}
</style>
