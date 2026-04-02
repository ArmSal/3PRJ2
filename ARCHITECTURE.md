# Discord-Gaming Plus - Team Structure & Architecture

## Team Roles (4 Students)

| Role | Name | Responsibilities |
|------|------|------------------|
| **DevOps Lead** | Armend SALIHU | Docker, CI/CD, K8s bonus, deployment, repo setup, infrastructure |
| **Backend Dev** | Babikir IBRAHIM AL KHALIL | Node.js API, Socket.io, MySQL database, game logic, auth |
| **Frontend Dev** | Fedi Khaldi | Vue.js UI, chat interface, responsive design, game screens |
| **Full-Stack/Games** | Abid RAKHIS AHMAT | Mini-games (Canvas Pong/Snake), WebRTC integration, helps bridge FE/BE |

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │  Vue.js 3 + Socket.io-client
│   (Nginx)       │  Port: 80
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  Node.js + Express + Socket.io
│   (Node)        │  Port: 3000
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MySQL         │  Database
│   (MySQL 8)     │  Port: 3306
└─────────────────┘
```

## Tech Stack

### Frontend
- Vue.js 3 (Composition API)
- Vue Router
- Socket.io-client
- Axios
- Canvas API for games
- CSS Grid/Flexbox (responsive)

### Backend
- Node.js 18
- Express.js
- Socket.io (real-time chat + games)
- MySQL2 (database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- (Optional) Kubernetes for +20% bonus

## Database Schema

**Tables:**
- `users` - user accounts (id, username, email, password_hash)
- `guilds` - communities/servers (id, name, description, created_by)
- `guild_members` - membership (user_id, guild_id, role)
- `channels` - chat channels (id, guild_id, name, type)
- `messages` - chat history (id, channel_id, user_id, content, created_at)
- `games` - game sessions (id, channel_id, game_type, status, players, winner)

## MVP Features Priority

### Must Have (Day 1)
- [ ] User registration/login with JWT
- [ ] Create/join guilds
- [ ] Real-time text chat (Socket.io)
- [ ] Docker containers running

### Should Have (Day 2 AM)
- [ ] Pong game (2 players, real-time)
- [ ] Game lobby/matchmaking
- [ ] Deployed to cloud

### Nice to Have (Day 2 PM)
- [ ] Snake game
- [ ] Spectator mode
- [ ] Kubernetes deployment (+20%)

## Communication Protocol

**Socket.io Events:**
- `join-channel` - Subscribe to guild channel
- `send-message` - Send chat message
- `new-message` - Receive chat message
- `game-invite` - Invite to play
- `game-join` - Join game session
- `game-state` - Sync game data (ball position, scores)
- `game-move` - Player input (paddle up/down)

## File Structure

```
3PRJ2/
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── init.sql
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── index.html
    └── src/
        ├── main.js
        ├── router.js
        ├── App.vue
        └── views/
            ├── Login.vue
            ├── Chat.vue
            └── Pong.vue
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Create account |
| POST | /api/login | Authenticate |
| GET | /api/guilds | List guilds |
| POST | /api/guilds | Create guild |
| GET | /api/channels/:id/messages | Get messages |

## Next Actions

1. Assign team member names to roles
2. Initialize GitHub repository
3. Each dev sets up local environment
4. Run `docker-compose up` to verify setup
5. Begin Day 1 development sprint
