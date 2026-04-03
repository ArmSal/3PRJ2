import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import Chat from './views/Chat.vue'
import Games from './views/Games.vue'
import Pong from './views/Pong.vue'
import Snake from './views/Snake.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/games', component: Games, meta: { requiresAuth: true } },
  { path: '/games/pong', component: Pong, meta: { requiresAuth: true } },
  { path: '/pong', component: Pong },
  { path: '/snake', component: Snake },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next('/login')
  } else {
    next()
  }
})

export default router
