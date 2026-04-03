import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/index.css'

import axios from 'axios'

// Set API base URL: 
// - If VITE_API_URL is set (Production/Render), use it.
// - If not, use an empty string (Relative path) to leverage Vite/Nginx proxy.
const apiUrl = import.meta.env.VITE_API_URL || '';
axios.defaults.baseURL = apiUrl;
console.log('🔌 [SYSTEM] API Nexus established at:', apiUrl || '(Relative Proxy)');

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
