import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Configure API URL - en production Docker, utiliser /api (nginx proxy), sinon localhost:3004
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api'

createApp(App).use(router).mount('#app')
