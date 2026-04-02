<template>
  <div class="chat-layout">
    <div class="sidebar">
      <h3>Guilds</h3>
      <div v-for="guild in guilds" :key="guild.id" 
           @click="selectGuild(guild)" 
           :class="['guild-item', { active: selectedGuild?.id === guild.id }]">
        {{ guild.name }}
      </div>
      <button @click="createGuild" style="margin-top: 10px; width: 100%;">+ New Guild</button>
      <button @click="logout" style="margin-top: auto; width: 100%; background: #444;">Logout</button>
    </div>
    
    <div class="main">
      <div class="header">
        <h3>{{ selectedGuild?.name || 'Select a guild' }}</h3>
      </div>
      <div class="messages" ref="messagesContainer">
        <div v-for="msg in messages" :key="msg.id" class="message">
          <strong>{{ msg.username }}:</strong> {{ msg.content }}
        </div>
      </div>
      <div class="input-area">
        <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
        <button @click="sendMessage">Send</button>
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
      user: JSON.parse(localStorage.getItem('user'))
    }
  },
  async mounted() {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    await this.loadGuilds()
    
    this.socket = io()
    this.socket.on('new-message', (msg) => {
      if (msg.channelId === this.selectedGuild?.id) {
        this.messages.push(msg)
        this.scrollToBottom()
      }
    })
  },
  methods: {
    async loadGuilds() {
      const { data } = await axios.get('/api/guilds')
      this.guilds = data
      if (data.length) this.selectGuild(data[0])
    },
    async selectGuild(guild) {
      this.selectedGuild = guild
      this.socket.emit('join-channel', guild.id)
      const { data } = await axios.get(`/api/channels/${guild.id}/messages`)
      this.messages = data
      this.scrollToBottom()
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
        await axios.post('/api/guilds', { name, description: '' })
        await this.loadGuilds()
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) container.scrollTop = container.scrollHeight
      })
    },
    logout() {
      localStorage.clear()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.chat-layout { display: flex; height: 100vh; }
.sidebar { width: 250px; background: #16213e; padding: 20px; display: flex; flex-direction: column; }
.guild-item { padding: 10px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; }
.guild-item:hover, .guild-item.active { background: #0f3460; }
.main { flex: 1; display: flex; flex-direction: column; }
.header { padding: 20px; background: #16213e; border-bottom: 1px solid #0f3460; }
.messages { flex: 1; overflow-y: auto; padding: 20px; }
.message { padding: 5px 0; }
.input-area { display: flex; padding: 20px; background: #16213e; gap: 10px; }
.input-area input { flex: 1; }
button { background: #e91e63; color: #fff; }
</style>
