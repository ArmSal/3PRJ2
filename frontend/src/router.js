import { createRouter, createWebHistory } from 'vue-router'
import Landing from './views/Landing.vue'
import Login from './views/Login.vue'
import Chat from './views/Chat.vue'
import Games from './views/Games.vue'
import Pong from './views/Pong.vue'
import Snake from './views/Snake.vue'
import Spectator from './views/Spectator.vue'
import Trivia from './views/Trivia.vue'
import Tournaments from './views/Tournaments.vue'
import Chess from './views/Chess.vue'

const routes = [
  { path: '/', component: Landing },
  { path: '/login', component: Login },
  { path: '/chat', component: Chat, meta: { requiresAuth: true } },
  { path: '/games', component: Games, meta: { requiresAuth: true } },
  { path: '/games/pong', component: Pong, meta: { requiresAuth: true } },
  { path: '/pong', component: Pong },
  { path: '/snake', component: Snake, meta: { requiresAuth: true } },
  { path: '/trivia', component: Trivia, meta: { requiresAuth: true } },
  { path: '/chess', component: Chess, meta: { requiresAuth: true } },
  { path: '/tournaments', component: Tournaments, meta: { requiresAuth: true } },
  { path: '/spectate/:id', component: Spectator, meta: { requiresAuth: true } },
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
