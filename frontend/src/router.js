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
import TicTacToe from './views/TicTacToe.vue'
import Settings from './views/Settings.vue'

const routes = [
  { path: '/', component: Landing },
  { path: '/login', component: Login },
  { path: '/chat', redirect: '/app' },
  { path: '/games', redirect: '/app/games' },
  { 
    path: '/app', 
    component: Chat, 
    meta: { requiresAuth: true },
    children: [
      { path: 'games', component: Games },
      { path: 'games/pong', component: Pong },
      { path: 'pong', component: Pong },
      { path: 'snake', component: Snake },
      { path: 'trivia', component: Trivia },
      { path: 'chess', component: Chess },
      { path: 'ttt', component: TicTacToe },
      { path: 'tournaments', component: Tournaments },
      { path: 'spectate/:id', component: Spectator },
      { path: 'settings', component: Settings },
    ]
  }
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
