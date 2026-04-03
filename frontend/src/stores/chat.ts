import { defineStore } from 'pinia'
import axios from 'axios'
import type { Guild, Message, User } from '@/types'

interface ChatState {
  guilds: Guild[];
  selectedGuild: Guild | null;
  channels: any[];
  selectedChannel: any | null;
  messages: Message[];
  onlineUsers: User[];
  offlineUsers: User[];
  typingUsers: string[];
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    guilds: [],
    selectedGuild: null,
    channels: [],
    selectedChannel: null,
    messages: [],
    onlineUsers: [],
    offlineUsers: [],
    typingUsers: [],
    authenticated: false,
    loading: false,
    error: null
  }),

  actions: {
    async fetchGuilds() {
      this.loading = true
      try {
        const { data } = await axios.get<Guild[]>('/api/guilds')
        this.guilds = data
        console.log(`📡 [SYSTEM] Neural networks retrieved: ${data.length} units.`);
        
        if (data.length > 0 && !this.selectedGuild) {
          this.selectedGuild = data[0]
          console.log('✅ [SYSTEM] Defaulting to primary neural network:', this.selectedGuild.name);
          await this.fetchChannels(this.selectedGuild.id)
        }
      } catch (err: any) {
        this.error = 'Failed to load guilds'
      } finally {
        this.loading = false
      }
    },

    async fetchChannels(guildId: number | string) {
      this.loading = true
      console.log(`📡 [SYSTEM] Fetching tactical channels for guild: ${guildId}`);
      try {
        const { data } = await axios.get<any[]>(`/api/guilds/${guildId}/channels`)
        this.channels = data
        if (data.length > 0) {
          // Auto-select first channel only if none is currently selected or if switching guilds
          if (!this.selectedChannel || this.selectedChannel.guild_id !== guildId) {
            this.selectedChannel = data[0]
            console.log('✅ [SYSTEM] Auto-selected channel:', this.selectedChannel.name);
            await this.fetchMessages(this.selectedChannel.id)
          }
        } else {
          this.selectedChannel = null;
          console.warn('⚠️ [SYSTEM] Guild reported zero tactical channels.');
        }
      } catch (err: any) {
        console.error('❌ [SYSTEM] Tactical channel sync failed:', err);
        this.error = 'Failed to load channels'
      } finally {
        this.loading = false
      }
    },

    async fetchMessages(channelId: number | string) {
      if (!channelId) return
      this.loading = true
      try {
        // Corrected full API path for messages
        const { data } = await axios.get<Message[]>(`/api/guilds/channels/${channelId}/messages`)
        this.messages = data
      } catch (err: any) {
        this.error = 'Failed to load messages'
      } finally {
        this.loading = false
      }
    },

    async createGuild(name: string) {
      try {
        const { data } = await axios.post<{ id: number }>('/api/guilds', { name, description: '' })
        await this.fetchGuilds()
        return data.id
      } catch (err: any) {
        this.error = 'Failed to create guild'
        return null
      }
    },

    setOnlineUsers(users: (User & { online?: boolean })[]) {
      this.onlineUsers = users.filter(u => u.online !== false)
      this.offlineUsers = users.filter(u => u.online === false)
    },

    addTypingUser(username: string) {
      if (!this.typingUsers.includes(username)) {
        this.typingUsers.push(username)
      }
    },

    removeTypingUser(username: string) {
      this.typingUsers = this.typingUsers.filter(u => u !== username)
    },

    addMessage(msg: Message) {
      this.messages.push(msg)
    },

    initSocketListeners(socket: any) {
      // Clean up existing listeners to prevent duplicates
      socket.off('authenticated');
      socket.off('new-message');
      socket.off('users:online');
      socket.off('user:typing');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('error');
      
      socket.on('authenticated', (data: { success: boolean }) => {
        if (data.success) {
          this.authenticated = true;
          console.log('✅ NEURAL LOG LINKED: User authenticated successfully');
        } else {
          this.authenticated = false;
          console.warn('❌ NEURAL LINK REJECTED: Check credentials or secret key.');
          this.error = 'Socket authentication failed';
        }
      });

      socket.on('new-message', (msg: any) => {
        console.log('📩 TRANSITION RECEIVED:', msg);
        // Map snake_case to camelCase if needed (Postgres compatibility)
        const channelId = msg.channelId || msg.channel_id;
        
        // Only add if it belongs to current tactical channel
        if (Number(channelId) === Number(this.selectedChannel?.id)) {
          console.log('✅ SYNCING MESSAGE TO UI');
          this.addMessage({
            ...msg,
            channelId: Number(channelId)
          })
        } else {
          console.log(`ℹ️ MESSAGE FILTERED: For channel ${channelId}, active is ${this.selectedChannel?.id}`);
        }
      })

      socket.on('users:online', (users: User[]) => {
        this.setOnlineUsers(users)
      })

      socket.on('user-online', (user: User) => {
        console.log('👤 USER ONLINE:', user);
        if (!this.onlineUsers.find(u => u.id === user.id || u.username === user.username)) {
          this.onlineUsers.push(user);
        }
      })

      socket.on('user-offline', ({ userId }: { userId: number }) => {
        console.log('👤 USER OFFLINE:', userId);
        this.onlineUsers = this.onlineUsers.filter(u => u.id !== userId);
      })

      socket.on('user:typing', ({ username, isTyping }: { username: string, isTyping: boolean }) => {
        if (isTyping) this.addTypingUser(username)
        else this.removeTypingUser(username)
      })

      socket.on('error', (err: any) => {
        console.error('❌ NEXUS_SYSTEM_ERROR:', err);
        this.error = err.message || 'Unknown Tactical Failure';
      })
    }
  }
})
