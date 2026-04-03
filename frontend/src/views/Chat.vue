<template>
  <div class="chat-layout">
    
    <!-- Left Sidebar - Guilds (Icons Only) -->
    <aside class="guilds-sidebar-mini glass-card">
      <div class="brand-mini">
        <span class="brand-icon">🎮</span>
      </div>
      <div class="guilds-divider"></div>
      
      <div class="guilds-list-mini">
        <div 
          v-for="guild in guilds" 
          :key="guild.id"
          :class="['guild-icon', { active: selectedGuild?.id === guild.id }]"
          @click="selectGuild(guild)"
          :title="guild.name"
        >
          {{ guild.name.charAt(0).toUpperCase() }}
          <div v-if="guild.unread" class="unread-dot"></div>
        </div>
        
        <div class="guild-icon add-guild" @click="createGuild" title="New Guild">
          +
        </div>
      </div>
    </aside>

    <!-- Context Sidebar - Channels -->
    <aside v-if="selectedGuild" class="channels-sidebar glass-card">
      <div class="guild-header-sidebar">
        <h3>{{ selectedGuild.name }}</h3>
      </div>
      
      <div class="channels-section">
        <div class="channels-category-header">
          <span>TEXT CHANNELS</span>
        </div>
        <div class="channels-list">
          <div class="channel-item active">
            <span class="channel-hash">#</span>
             general
          </div>
          <div class="channel-item">
            <span class="channel-hash">#</span>
             gaming
          </div>
        </div>
      </div>
      
      <div class="channels-section">
        <div class="channels-category-header">
          <span>VOICE CHANNELS</span>
        </div>
        <div class="channels-list">
          <div 
            :class="['channel-item', 'voice-item', { active: voiceChannel === 'lounge' }]"
            @click="toggleVoice('lounge')"
          >
            <span class="voice-icon">🔊</span>
             Lounge
          </div>
          
          <!-- Voice Active Users Panel -->
          <div v-if="voiceChannel === 'lounge'" class="voice-users">
            <div v-for="vUser in voiceUsers" :key="vUser.id" class="voice-user-item">
              <div class="voice-avatar">{{ vUser.username.charAt(0).toUpperCase() }}</div>
              <span>{{ vUser.username }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Voice Status Banner (Bottom of Channels) -->
      <div v-if="voiceChannel" class="voice-status-panel">
        <div class="voice-status-info">
          <span class="voice-connected-text">Voice Connected</span>
          <span class="voice-channel-name">Lounge</span>
        </div>
        <button @click="disconnectVoice" class="btn-disconnect-voice" title="Disconnect">📞</button>
      </div>

      <!-- User controls at bottom -->
      <div class="user-controls">
        <div class="user-controls-info">
          <div class="user-avatar-small">{{ user.username?.charAt(0).toUpperCase() }}</div>
          <div class="user-name-status">
            <div class="ctrl-username">{{ user.username }}</div>
            <div class="ctrl-status">Online</div>
          </div>
        </div>
        <div class="user-actions">
          <button @click="toggleMute" class="control-btn">{{ isMuted ? '🔇' : '🎤' }}</button>
          <button @click="goToSettings" class="control-btn">⚙️</button>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="main-content">
      <!-- Header -->
      <header class="chat-header glass-card">
        <div class="header-left">
          <div class="channel-info">
            <span class="hash">#</span>
            <span class="channel-name">{{ selectedGuild?.name || 'general' }}</span>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search..." class="search-input" />
          </div>
          
          <button @click="goToGames" class="btn-header btn-games">
            <span>🎮</span>
            <span>Games</span>
          </button>
          
          <div class="user-menu">
            <div class="user-avatar" @click="showUserMenu = !showUserMenu">
              {{ user.username?.charAt(0).toUpperCase() }}
            </div>
            
            <div v-if="showUserMenu" class="dropdown-menu glass-card">
              <div class="dropdown-item" @click="goToProfile">
                <span>👤</span> Profile
              </div>
              <div class="dropdown-item" @click="goToSettings">
                <span>⚙️</span> Settings
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" @click="logout">
                <span>🚪</span> Logout
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Messages -->
      <div class="messages-area" ref="messagesContainer">
        <div v-if="loading" class="messages-loading">
          <div class="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Be the first to send a message!</p>
        </div>
        
        <div v-else class="messages-list">
          <div 
            v-for="(msg, index) in messages" 
            :key="msg.id"
            :class="['message', { 'message-own': msg.userId === user.id }]"
          >
            <div class="message-avatar">
              {{ msg.username?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="message-body">
              <div class="message-header">
                <span class="message-author">{{ msg.username }}</span>
                <span class="message-time">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="message-text">{{ msg.content }}</div>
              
              <!-- Reactions -->
              <div v-if="msg.reactions?.length" class="message-reactions">
                <span v-for="reaction in msg.reactions" :key="reaction" class="reaction">
                  {{ reaction }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="typingUsers.length > 0" class="typing-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>{{ typingText }}</span>
      </div>

      <!-- Input Area -->
      <div class="input-area glass-card">
        <div class="input-toolbar">
          <button class="toolbar-btn" title="Add emoji">😀</button>
          <button class="toolbar-btn" title="Attach file">📎</button>
          <button class="toolbar-btn" title="GIF">GIF</button>
        </div>
        <div class="message-input-wrapper">
          <input 
            v-model="newMessage" 
            @keyup.enter="sendMessage"
            @input="onTyping"
            placeholder="Message #{{ selectedGuild?.name || 'general' }}"
            class="message-input"
          />
          <button @click="sendMessage" class="btn-send" :disabled="!newMessage.trim()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Right Sidebar - Online Users -->
    <aside class="users-sidebar glass-card">
      <div class="sidebar-section">
        <h4 class="section-title">
          Online — {{ onlineUsers.length }}
        </h4>
        <div class="users-list">
          <div 
            v-for="user in onlineUsers" 
            :key="user.id" 
            class="user-item"
            @click="startDM(user)"
          >
            <div class="user-avatar-wrapper">
              <div class="user-avatar-small">
                {{ user.username?.charAt(0).toUpperCase() }}
              </div>
              <span class="status-dot online"></span>
            </div>
            <span class="user-name">{{ user.username }}</span>
            <span class="user-status">Online</span>
          </div>
        </div>
      </div>
      
      <div class="sidebar-section">
        <h4 class="section-title">
          Offline — {{ offlineUsers.length }}
        </h4>
        <div class="users-list">
          <div 
            v-for="user in offlineUsers" 
            :key="user.id" 
            class="user-item offline"
          >
            <div class="user-avatar-wrapper">
              <div class="user-avatar-small gray">
                {{ user.username?.charAt(0).toUpperCase() }}
              </div>
              <span class="status-dot offline"></span>
            </div>
            <span class="user-name">{{ user.username }}</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  data() {
    return {
      socket: null,
      guilds: [],
      selectedGuild: null,
      messages: [],
      newMessage: '',
      user: JSON.parse(localStorage.getItem('user') || '{}'),
      onlineUsers: [],
      offlineUsers: [],
      typingUsers: [],
      loading: false,
      showUserMenu: false,
      typingTimeout: null,

      voiceChannel: null,
      voiceUsers: [],
      isMuted: false,

    }
  },
  computed: {
    typingText() {
      if (this.typingUsers.length === 1) {
        return `${this.typingUsers[0]} is typing...`
      } else if (this.typingUsers.length === 2) {
        return `${this.typingUsers[0]} and ${this.typingUsers[1]} are typing...`
      } else if (this.typingUsers.length > 2) {
        return 'Several people are typing...'
      }
      return ''
    }
  },
  async mounted() {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    this.loading = true
    
    await this.loadGuilds()
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    })
    
    this.socket.on('connect', () => {
      console.log('Connected to chat')
    })
    
    this.socket.on('new-message', (msg) => {
      if (msg.channelId === this.selectedGuild?.id) {
        this.messages.push(msg)
        this.scrollToBottom()
      }
    })
    
    this.socket.on('users:online', (users) => {
      this.onlineUsers = users.filter(u => u.online)
      this.offlineUsers = users.filter(u => !u.online)
    })
    
    this.socket.on('user:typing', ({ username, isTyping }) => {
      if (isTyping) {
        if (!this.typingUsers.includes(username)) {
          this.typingUsers.push(username)
        }
      } else {
        this.typingUsers = this.typingUsers.filter(u => u !== username)
      }
    })
    
    this.socket.emit('get-online-users')
    this.loading = false
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect()
  },
  methods: {

    toggleVoice(channelName) {
      if (this.voiceChannel === channelName) {
        this.disconnectVoice();
      } else {
        this.voiceChannel = channelName;
        this.socket.emit('voice-join', this.selectedGuild.id + '-' + channelName);
        this.voiceUsers.push({ id: this.user.id, username: this.user.username });
      }
    },
    disconnectVoice() {
      if(this.voiceChannel) {
        this.socket.emit('voice-leave', this.selectedGuild.id + '-' + this.voiceChannel);
      }
      this.voiceChannel = null;
      this.voiceUsers = [];
    },
    toggleMute() {
      this.isMuted = !this.isMuted;
    },

    async loadGuilds() {
      try {
        const { data } = await axios.get('/api/guilds')
        this.guilds = data
        if (data.length) this.selectGuild(data[0])
      } catch (e) {
        console.error('Failed to load guilds:', e)
      }
    },
    async selectGuild(guild) {
      this.selectedGuild = guild
      this.socket.emit('join-channel', guild.id)
      this.loading = true
      try {
        const { data } = await axios.get(`/api/channels/${guild.id}/messages`)
        this.messages = data
        this.scrollToBottom()
      } catch (e) {
        console.error('Failed to load messages:', e)
      } finally {
        this.loading = false
      }
    },
    sendMessage() {
      if (!this.newMessage.trim() || !this.selectedGuild) return
      
      this.socket.emit('send-message', {
        channelId: this.selectedGuild.id,
        content: this.newMessage,
        userId: this.user.id,
        username: this.user.username
      })
      
      // Optimistic UI
      this.messages.push({
        id: Date.now(),
        userId: this.user.id,
        username: this.user.username,
        content: this.newMessage,
        created_at: new Date().toISOString()
      })
      
      this.newMessage = ''
      this.scrollToBottom()
      
      // Stop typing indicator
      this.socket.emit('typing', { channelId: this.selectedGuild.id, isTyping: false })
    },
    onTyping() {
      if (!this.selectedGuild) return
      
      this.socket.emit('typing', { channelId: this.selectedGuild.id, isTyping: true })
      
      clearTimeout(this.typingTimeout)
      this.typingTimeout = setTimeout(() => {
        this.socket.emit('typing', { channelId: this.selectedGuild.id, isTyping: false })
      }, 3000)
    },
    async createGuild() {
      const name = prompt('Enter guild name:')
      if (!name) return
      
      try {
        await axios.post('/api/guilds', { name, description: '' })
        await this.loadGuilds()
      } catch (e) {
        alert('Failed to create guild: ' + e.response?.data?.error)
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) container.scrollTop = container.scrollHeight
      })
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    },
    startDM(user) {
      // Future feature
      console.log('Start DM with', user.username)
    },
    goToGames() {
      this.$router.push('/games')
    },
    goToProfile() {
      // Future feature
      alert('Profile page coming soon!')
    },
    goToSettings() {
      // Future feature
      alert('Settings page coming soon!')
    },
    logout() {
      localStorage.clear()
      if (this.socket) this.socket.disconnect()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  padding: 12px;
  gap: 12px;
  background: var(--bg-dark);
}


/* Discord Layout Styles */
.guilds-sidebar-mini {
  width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 8px;
  background: rgba(10, 10, 15, 0.9);
  border-right: 1px solid var(--border-glass);
}

.brand-mini {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: border-radius 0.3s;
}

.brand-mini:hover {
  border-radius: 12px;
}

.guilds-divider {
  width: 32px;
  height: 2px;
  background: var(--border-glass);
  margin: 4px 0;
}

.guilds-list-mini {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
  flex: 1;
  overflow-y: auto;
}

.guild-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.guild-icon:hover {
  border-radius: 16px;
  background: var(--primary);
}

.guild-icon.active {
  border-radius: 16px;
  background: var(--primary);
}

.unread-dot {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-primary);
}

.guild-icon.add-guild {
  color: var(--neon-green);
  background: rgba(0, 255, 136, 0.1);
}
.guild-icon.add-guild:hover {
  background: var(--neon-green);
  color: #000;
}

/* Channels Sidebar */
.channels-sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 30, 0.85);
  border-right: 1px solid var(--border-glass);
}

.guild-header-sidebar {
  padding: 16px;
  border-bottom: 1px solid var(--border-glass);
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.guild-header-sidebar h3 {
  font-size: 16px;
  font-weight: 700;
}

.channels-section {
  padding: 16px 8px 0;
}

.channels-category-header {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 0 8px 8px;
}

.channels-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
}

.channel-item:hover {
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
}

.channel-item.active {
  background: rgba(255,255,255,0.1);
  color: var(--text-primary);
}

.channel-hash {
  font-size: 18px;
  color: var(--text-secondary);
}

.voice-icon {
  font-size: 16px;
}

.voice-users {
  padding-left: 24px;
  margin-top: 4px;
}

.voice-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.voice-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
}

.voice-status-panel {
  margin-top: auto;
  border-top: 1px solid var(--border-glass);
  padding: 8px;
  background: rgba(0,255,136,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.voice-connected-text {
  color: var(--neon-green);
  font-size: 12px;
  font-weight: 700;
  display: block;
}

.voice-channel-name {
  color: var(--text-secondary);
  font-size: 12px;
}

.btn-disconnect-voice {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.7;
}

.btn-disconnect-voice:hover {
  opacity: 1;
}

.user-controls {
  padding: 12px 8px;
  background: rgba(10, 10, 15, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-glass);
}

.user-controls-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.ctrl-username {
  font-size: 13px;
  font-weight: 700;
}

.ctrl-status {
  font-size: 11px;
  color: var(--text-secondary);
}

.user-actions {
  display: flex;
  gap: 4px;
}

.control-btn {
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
}

.control-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.1);
}


/* Extracted Sidebar styles replaced */
.guilds-sidebar {
  width: 260px;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.sidebar-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-glass);
  margin-bottom: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  font-weight: 700;
  font-size: 16px;
}

.guilds-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guild-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.guild-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.guild-item.active {
  background: var(--primary);
}

.guild-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--neon-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.guild-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.guild-name {
  font-weight: 600;
  font-size: 14px;
}

.guild-members {
  font-size: 12px;
  color: var(--text-secondary);
}

.unread-badge {
  position: absolute;
  right: 12px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.btn-create-guild {
  margin-top: 16px;
  padding: 12px;
  background: transparent;
  border: 2px dashed var(--border-glass);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-create-guild:hover {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.plus-icon {
  font-size: 20px;
  font-weight: 300;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-header {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hash {
  color: var(--text-secondary);
  font-size: 24px;
  font-weight: 300;
}

.channel-name {
  font-weight: 700;
  font-size: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-secondary);
}

.search-input {
  padding: 10px 12px 10px 36px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 14px;
  width: 200px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  width: 280px;
  border-color: var(--neon-blue);
}

.btn-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s;
}

.btn-header:hover {
  border-color: var(--neon-blue);
}

.btn-games {
  background: linear-gradient(135deg, rgba(59, 165, 93, 0.2), rgba(59, 165, 93, 0.1));
  border-color: var(--secondary);
}

.btn-games:hover {
  background: var(--secondary);
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--neon-pink));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.1);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  min-width: 180px;
  padding: 8px;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.danger {
  color: var(--danger);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-glass);
  margin: 8px 0;
}

/* Messages Area */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.messages-loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
}

.empty-state h3 {
  color: var(--text-primary);
  font-weight: 600;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  margin: 0 -16px;
  border-radius: 8px;
  transition: background 0.2s;
}

.message:hover {
  background: rgba(255, 255, 255, 0.03);
}

.message-own {
  background: rgba(88, 101, 242, 0.1);
}

.message-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--neon-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.message-body {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-author {
  font-weight: 600;
  color: var(--neon-blue);
}

.message-own .message-author {
  color: var(--neon-pink);
}

.message-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.message-text {
  color: var(--text-primary);
  line-height: 1.5;
}

.message-reactions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.reaction {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--neon-blue);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

/* Input Area */
.input-area {
  padding: 16px 20px;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.message-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 4px 4px 4px 20px;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  padding: 12px 0;
}

.message-input:focus {
  outline: none;
}

.message-input::placeholder {
  color: var(--text-secondary);
}

.btn-send {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--primary);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-send:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Users Sidebar */
.users-sidebar {
  width: 240px;
  padding: 16px;
}

.sidebar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-item.offline {
  opacity: 0.6;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--neon-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.user-avatar-small.gray {
  background: #4a4a4a;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}

.status-dot.online {
  background: var(--neon-green);
}

.status-dot.offline {
  background: var(--text-secondary);
}

.user-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.user-status {
  font-size: 12px;
  color: var(--neon-green);
}

/* Responsive */
@media (max-width: 1200px) {
  .users-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .chat-layout {
    padding: 8px;
  }
  
  .guilds-sidebar {
    width: 72px;
    padding: 12px 8px;
  }
  
  .brand-text,
  .guild-info,
  .btn-create-guild span {
    display: none;
  }
  
  .guild-avatar {
    width: 48px;
    height: 48px;
  }
  
  .search-input,
  .search-input:focus {
    width: 140px;
  }
  
  .btn-header span {
    display: none;
  }
}
</style>
