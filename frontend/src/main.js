import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Configure API URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

createApp(App).use(router).mount('#app')
