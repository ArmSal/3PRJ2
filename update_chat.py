import re

with open('c:/Users/armen/Desktop/3PRJ2/frontend/src/views/Chat.vue', 'r', encoding='utf-8') as f:
    content = f.read()

template_replacement = """
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
"""

new_template = re.sub(
    r'<!-- Left Sidebar - Guilds -->.*?<!-- Main Chat Area -->', 
    template_replacement + '\n    <!-- Main Chat Area -->', 
    content, 
    flags=re.DOTALL
)

script_addition = """
      voiceChannel: null,
      voiceUsers: [],
      isMuted: false,
"""
new_template = new_template.replace('typingTimeout: null', 'typingTimeout: null,\n' + script_addition)

methods_addition = """
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
"""
new_template = new_template.replace('methods: {', 'methods: {\n' + methods_addition)

styles_addition = """
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

"""
new_template = new_template.replace('/* Guilds Sidebar */', styles_addition + '\n/* Extracted Sidebar styles replaced */')

with open('c:/Users/armen/Desktop/3PRJ2/frontend/src/views/Chat.vue', 'w', encoding='utf-8') as f:
    f.write(new_template)
