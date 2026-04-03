import { defineStore } from 'pinia'
import { io, Socket } from 'socket.io-client'
import type { Game } from '@/types'

interface GameState {
  socket: Socket | null;
  availableGames: Game[];
  activeGameId: string | null;
  loading: boolean;
  error: string | null;
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    socket: null,
    availableGames: [],
    activeGameId: null,
    loading: false,
    error: null
  }),

  actions: {
    initSocket(token: string | null) {
      if (this.socket) {
        // If already connected and token is provided, ensure we are authenticated
        if (token) {
           this.socket.emit('authenticate', token);
        }
        return;
      }

      // Determine socket connection URL
      // If VITE_API_URL is set, use it. Otherwise, use the current origin (Relative Proxy).
      const socketUrl = import.meta.env.VITE_API_URL || '';
      
      this.socket = io(socketUrl, {
        auth: { token }
      })

      this.socket.on('connect', () => {
        console.log('Operational: Socket connection established')
        if (token) {
          this.socket?.emit('authenticate', token)
        }
      })

      this.socket.on('disconnect', () => {
        console.warn('Alert: Socket connection terminated')
      })

      this.socket.on('game-available', (game: Game) => {
        console.log('📡 [NEXUS] New game session available:', game);
        if (!this.availableGames.find(g => g.gameId === game.gameId)) {
          this.availableGames.push(game)
        }
      })

      this.socket.on('game-started', (data: { gameId: string }) => {
        console.log('⚔️ [NEXUS] Technical engagement initiated:', data.gameId);
        this.activeGameId = data.gameId
        this.availableGames = this.availableGames.filter(g => g.gameId !== data.gameId)
      })

      this.socket.on('error', (err: any) => {
        this.error = err.message || 'Transmission error'
      })
    },

    setAvailableGames(games: Game[]) {
      this.availableGames = games
    },

    setActiveGame(gameId: string | null) {
      this.activeGameId = gameId
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
    }
  }
})
