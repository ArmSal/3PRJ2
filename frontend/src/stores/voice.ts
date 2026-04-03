import { defineStore } from 'pinia'

interface VoiceState {
  isInVoice: boolean;
  voiceChannelId: number | null;
  voiceUsers: string[];
  isMuted: boolean;
  localStream: MediaStream | null;
  peers: Map<string, RTCPeerConnection>;
  isDeafened: boolean;
}

export const useVoiceStore = defineStore('voice', {
  state: (): VoiceState => ({
    isInVoice: false,
    voiceChannelId: null,
    voiceUsers: [],
    isMuted: false,
    localStream: null,
    peers: new Map(),
    isDeafened: false
  }),

  actions: {
    async joinVoice(channelId: number, socket: any) {
      try {
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.localStream = stream
        this.voiceChannelId = channelId
        this.isInVoice = true
        this.isMuted = false
        this.isDeafened = false
        
        // Join voice channel via socket
        socket.emit('voice-join', channelId)
        
        // Setup WebRTC listeners
        this.setupVoiceListeners(socket)
        
        console.log('🎙️ VOICE CONNECTED: Channel', channelId)
      } catch (err) {
        console.error('❌ VOICE CONNECTION FAILED:', err)
        this.isInVoice = false
      }
    },

    setupVoiceListeners(socket: any) {
      // Clean up existing listeners first to prevent duplicates
      socket.off('voice-users')
      socket.off('user-joined-voice')
      socket.off('voice-offer')
      socket.off('voice-answer')
      socket.off('ice-candidate')

      // Listen for other users in voice - only fired when joining
      socket.on('voice-users', (users: string[]) => {
        console.log('🔊 EXISTING VOICE USERS:', users)
        this.voiceUsers = users
        // New user initiates connections to all existing users
        users.forEach(userId => {
          if (!this.peers.has(userId)) {
            this.createPeerConnection(userId, socket, true)
          }
        })
      })

      // User joined voice - existing user receives this
      socket.on('user-joined-voice', (userId: string) => {
        console.log('🎙️ NEW USER JOINED VOICE:', userId)
        if (!this.voiceUsers.includes(userId)) {
          this.voiceUsers.push(userId)
        }
        // Existing user does NOT initiate - waits for offer from new user
        // Only create peer connection if we don't have one and haven't received one
        if (!this.peers.has(userId)) {
          console.log('📡 Waiting for offer from new user...')
        }
      })

      // WebRTC signaling
      socket.on('voice-offer', async (data: { sender: string, offer: RTCSessionDescriptionInit }) => {
        console.log('📡 VOICE OFFER from', data.sender)
        await this.handleOffer(data.sender, data.offer, socket)
      })

      socket.on('voice-answer', async (data: { sender: string, answer: RTCSessionDescriptionInit }) => {
        console.log('📡 VOICE ANSWER from', data.sender)
        await this.handleAnswer(data.sender, data.answer)
      })

      socket.on('ice-candidate', async (data: { sender: string, candidate: RTCIceCandidateInit }) => {
        await this.handleIceCandidate(data.sender, data.candidate)
      })
    },

    async createPeerConnection(userId: string, socket: any, isInitiator: boolean) {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      // Add local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream!)
        })
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { target: userId, candidate: event.candidate })
        }
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('🔊 REMOTE STREAM from', userId, event.streams)
        const stream = event.streams[0]
        
        // Create audio element for remote user
        const audio = document.createElement('audio')
        audio.id = `audio-${userId}`
        audio.srcObject = stream
        audio.autoplay = true
        audio.volume = 1.0
        
        // Try to play (may fail due to autoplay policy until user interacts)
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('🔊 Audio play blocked, will retry on user interaction:', err)
            // Store for later playback
            ;(window as any).__pendingVoiceAudio = audio
          })
        }
        
        document.body.appendChild(audio)
        console.log('🔊 Audio element created for', userId)
      }

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log(`📡 Connection state with ${userId}:`, pc.connectionState)
      }
      
      pc.oniceconnectionstatechange = () => {
        console.log(`📡 ICE state with ${userId}:`, pc.iceConnectionState)
      }

      this.peers.set(userId, pc)

      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('voice-offer', { target: userId, offer })
      }

      return pc
    },

    async handleOffer(userId: string, offer: RTCSessionDescriptionInit, socket: any) {
      // Create peer connection if it doesn't exist (existing user receiving offer from new user)
      let pc = this.peers.get(userId)
      if (!pc) {
        pc = await this.createPeerConnection(userId, socket, false)
      }
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('voice-answer', { target: userId, answer })
    },

    async handleAnswer(userId: string, answer: RTCSessionDescriptionInit) {
      const pc = this.peers.get(userId)
      if (pc) {
        await pc.setRemoteDescription(answer)
      }
    },

    async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit) {
      const pc = this.peers.get(userId)
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    },

    toggleMute() {
      this.isMuted = !this.isMuted
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !this.isMuted
        })
      }
      console.log(this.isMuted ? '🔇 MUTED' : '🎙️ UNMUTED')
    },

    toggleDeafen() {
      this.isDeafened = !this.isDeafened
      // Mute all peer connections
      this.peers.forEach(pc => {
        pc.getReceivers().forEach(receiver => {
          if (receiver.track) {
            receiver.track.enabled = !this.isDeafened
          }
        })
      })
      console.log(this.isDeafened ? '🔇 DEAFENED' : '🔊 UNDEAFENED')
    },

    leaveVoice(socket: any) {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }

      // Close peer connections
      this.peers.forEach(pc => pc.close())
      this.peers.clear()

      // Reset state
      this.isInVoice = false
      this.voiceChannelId = null
      this.voiceUsers = []
      this.isMuted = false
      this.isDeafened = false

      // Remove audio elements
      document.querySelectorAll('audio').forEach(audio => audio.remove())

      console.log('🎙️ VOICE DISCONNECTED')
    }
  }
})
