import { defineStore } from 'pinia'
import axios from 'axios'
import type { User } from '@/types'

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    // Safe parse user from localStorage
    let user: User | null = null;
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== 'undefined') {
        user = JSON.parse(userData);
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage:', e);
      localStorage.removeItem('user');
    }
    return {
      user,
      token,
      loading: false,
      error: null
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUserId: (state) => state.user?.id
  },

  actions: {
    async login(credentials: object) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post('/api/login', credentials)
        this.setUser(data.user, data.token)
        return true
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Login failed'
        return false
      } finally {
        this.loading = false
      }
    },

    async register(userData: object) {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.post('/api/register', userData)
        this.setUser(data.user, data.token)
        return true
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Registration failed'
        return false
      } finally {
        this.loading = false
      }
    },

    setUser(user: User, token: string) {
      this.user = user
      this.token = token
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    },

    async updateProfile(payload: { username?: string, avatar?: string }) {
      try {
        const { data } = await axios.put('/api/users/profile', payload)
        // Sync returned data into local state
        if (this.user) {
          if (data.username) this.user.username = data.username
          if (data.avatar) this.user.avatar = data.avatar
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        return { success: true, user: data }
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || 'Update failed' }
      }
    }
  }
})
