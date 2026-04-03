import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/index.css'

import axios from 'axios'

// Set API base URL from environment or default to localhost
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = apiUrl;
console.log('🔌 API Base URL:', apiUrl);

// Global Tactical Header Interceptor
axios.interceptors.request.use((config) => {
  console.log('📡 Request:', config.method?.toUpperCase(), config.url);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
