<template>
  <div class="login">
    <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" placeholder="Username" required />
      <input v-if="!isLogin" v-model="email" placeholder="Email" type="email" required />
      <input v-model="password" placeholder="Password" type="password" required />
      <button type="submit">{{ isLogin ? 'Login' : 'Register' }}</button>
    </form>
    <p @click="isLogin = !isLogin" style="cursor: pointer; margin-top: 10px; color: #e91e63;">
      {{ isLogin ? 'Need account? Register' : 'Have account? Login' }}
    </p>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return { isLogin: true, username: '', email: '', password: '' }
  },
  methods: {
    async handleSubmit() {
      const endpoint = this.isLogin ? '/api/login' : '/api/register'
      const payload = this.isLogin 
        ? { username: this.username, password: this.password }
        : { username: this.username, email: this.email, password: this.password }
      
      try {
        const { data } = await axios.post(endpoint, payload)
        if (this.isLogin) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          this.$router.push('/chat')
        } else {
          this.isLogin = true
        }
      } catch (e) {
        console.error('Login/Register error:', e)
        const errorMsg = e.response?.data?.error || e.message || 'Network error - is backend running?'
        alert('Error: ' + errorMsg)
      }
    }
  }
}
</script>

<style scoped>
.login { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
form { display: flex; flex-direction: column; gap: 10px; width: 300px; margin-top: 20px; }
button { background: #e91e63; color: #fff; }
</style>
