<template>
  <div class="chat-layout">
    <!-- Left Sidebar - Guilds -->
    <div class="sidebar-left">
      <div class="guild-header">
        <h3>🎮 Gaming Plus</h3>
      </div>
      <div class="guild-list">
        <div v-for="guild in guilds" :key="guild.id" 
             @click="selectGuild(guild)" 
             :class="['guild-item', { active: selectedGuild?.id === guild.id }]">
          <div class="guild-icon">{{ guild.name.charAt(0).toUpperCase() }}</div>
          <span class="guild-name">{{ guild.name }}</span>
        </div>
      </div>
      <button @click="createGuild" class="btn-new-guild">+ New Guild</button>
    </div>

    <!-- Main Chat Area -->
    <div class="main">
      <div class="chat-header">
        <div class="channel-info">
          <span class="channel-icon">#</span>
          <span class="channel-name">{{ selectedGuild?.name || 'general' }}</span>
        </div>
        <div class="header-actions">
          <button @click="goToGames" class="btn-games">🎮 Games</button>
          <button @click="logout" class="btn-logout">Logout</button>
        </div>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg.id" class="message">
          <div class="message-avatar">{{ msg.username?.charAt(0).toUpperCase() || '?' }}</div>
          <div class="message-content">
            <div class="message-header">
              <span class="username">{{ msg.username }}</span>
              <span class="timestamp">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <input 
            v-model="newMessage" 
            @keyup.enter="sendMessage" 
            placeholder="Message #{{ selectedGuild?.name || 'general' }}..."
            class="message-input"
          />
          <button @click="sendMessage" class="btn-send">➤</button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar - Online Users -->
    <div class="sidebar-right">
      <div class="users-header">
        <h4>Online — {{ onlineUsers.length }}</h4>
      </div>
      <div class="users-list">
        <div v-for="user in onlineUsers" :key="user.id" class="user-item">
          <div class="user-avatar">{{ user.username?.charAt(0).toUpperCase() || '?' }}</div>
          <span class="username">{{ user.username }}</span>
          <span class="status-indicator online"></span>
        </div>
      </div>
    </div>
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
      onlineUsers: []
    }
  },
  async mounted() {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    await this.loadGuilds()
    
    // Connect to backend
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    })
    
    this.socket.on('connect', () => {
      console.log('Socket connected')
    })
    
    this.socket.on('new-message', (msg) => {
      if (msg.channelId === this.selectedGuild?.id) {
        this.messages.push(msg)
        this.scrollToBottom()
      }
    })
    
    this.socket.on('users:online', (users) => {
      this.onlineUsers = users
    })
    
    // Request online users
    this.socket.emit('get-online-users')
  },
  beforeUnmount() {
    if (this.socket) this.socket.disconnect()
  },
  methods: {
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
      try {
        const { data } = await axios.get(`/api/channels/${guild.id}/messages`)
        this.messages = data
        this.scrollToBottom()
      } catch (e) {
        console.error('Failed to load messages:', e)
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
      this.newMessage = ''
    },
    async createGuild() {
      const name = prompt('Guild name:')
      if (name) {
        try {
          await axios.post('/api/guilds', { name, description: '' })
          await this.loadGuilds()
        } catch (e) {
          alert('Failed to create guild: ' + e.response?.data?.error)
        }
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
    goToGames() {
      this.$router.push('/games')
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
  background: #36393f;
  font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* Left Sidebar - Guilds */
.sidebar-left {
  width: 240px;
  background: #2f3136;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #202225;
}

.guild-header {
  padding: 16px;
  border-bottom: 1px solid #202225;
}

.guild-header h3 {
  color: #fff;
  font-size: 16px;
  margin: 0;
}

.guild-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.guild-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.guild-item:hover, .guild-item.active {
  background: #393c43;
}

.guild-icon {
  width: 32px;
  height: 32px;
  background: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  margin-right: 12px;
  font-size: 14px;
}

.guild-name {
  color: #b9bbbe;
  font-size: 14px;
}

.guild-item.active .guild-name {
  color: #fff;
}

.btn-new-guild {
  margin: 8px;
  padding: 12px;
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-new-guild:hover {
  background: #4752c4;
}

/* Main Chat Area */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #36393f;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #202225;
  box-shadow: 0 1px 0 rgba(0,0,0,0.2);
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.channel-icon {
  color: #72767d;
  font-size: 24px;
  font-weight: bold;
}

.channel-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-games {
  padding: 8px 16px;
  background: #3ba55d;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-games:hover {
  background: #2d7d46;
}

.btn-logout {
  padding: 8px 16px;
  background: #ed4245;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-logout:hover {
  background: #c03537;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  display: flex;
  margin-bottom: 16px;
  padding: 4px 0;
}

.message:hover {
  background: rgba(255,255,255,0.02);
}

.message-avatar {
  width: 40px;
  height: 40px;
  background: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  margin-right: 16px;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.username {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.timestamp {
  color: #72767d;
  font-size: 12px;
}

.message-text {
  color: #dcddde;
  font-size: 15px;
  line-height: 1.4;
  word-wrap: break-word;
}

/* Input Area */
.input-area {
  padding: 16px;
  background: #36393f;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #40444b;
  border-radius: 8px;
  padding: 12px;
  gap: 12px;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #dcddde;
  font-size: 15px;
  outline: none;
}

.message-input::placeholder {
  color: #72767d;
}

.btn-send {
  width: 36px;
  height: 36px;
  background: #5865f2;
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-send:hover {
  background: #4752c4;
}

/* Right Sidebar - Users */
.sidebar-right {
  width: 240px;
  background: #2f3136;
  border-left: 1px solid #202225;
  padding: 16px;
}

.users-header h4 {
  color: #b9bbbe;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.users-list {
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #5865f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.user-item .username {
  color: #b9bbbe;
  font-size: 14px;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}

.status-indicator.online {
  background: #3ba55d;
}

/* Responsive Mobile */
@media (max-width: 1024px) {
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .sidebar-left {
    width: 72px;
  }
  
  .guild-name {
    display: none;
  }
  
  .btn-new-guild {
    font-size: 12px;
    padding: 8px;
  }
  
  .chat-header {
    padding: 12px;
  }
  
  .channel-name {
    font-size: 14px;
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
  
  .username {
    font-size: 14px;
  }
  
  .message-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .sidebar-left {
    display: none;
  }
  
  .chat-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
