# Discord-Gaming Plus

A cloud-native social gaming platform with real-time chat and browser mini-games, built for the 3PRJ2 Hackathon.

## Team

| Role | Name | GitHub |
|------|------|--------|
| DevOps Lead | Armend SALIHU | [@ArmSal](https://github.com/ArmSal) |
| Backend Developer | Babikir IBRAHIM AL KHALIL | - |
| Frontend Developer | Fedi Khaldi | - |
| Full-Stack/Games Developer | Abid RAKHIS AHMAT | - |

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │  HTTP   │    Backend      │  SQL    │     MySQL       │
│   Vue.js +      │◄───────►│   Node.js +     │◄───────►│    Database     │
│   Socket.io     │ WebSocket│  Express +      │         │                 │
│   (Nginx)       │         │   Socket.io     │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                                                        │
        └──────────────── Docker Compose ──────────────────────┘
```

### Tech Stack

**Frontend:**
- Vue.js 3 (Composition API)
- Vue Router
- Socket.io-client (real-time communication)
- Axios (HTTP requests)
- Canvas API (mini-games)
- Nginx (static file serving)

**Backend:**
- Node.js 18
- Express.js (REST API)
- Socket.io (WebSocket connections)
- MySQL2 (database driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- MySQL 8 (database)

## Features

### Must Have (MVP)
- [x] User registration & login (JWT auth)
- [x] Real-time text chat with Socket.io
- [x] Guild/Community creation
- [x] Docker containerization (3+ services)
- [x] GitHub Actions CI/CD

### Should Have
- [ ] Pong mini-game (2-player real-time)
- [ ] Game lobby and matchmaking
- [ ] Snake mini-game
- [ ] Cloud deployment

### Nice to Have
- [ ] Spectator mode
- [ ] Trivia mini-game
- [ ] Kubernetes deployment (+20% bonus)
- [ ] Voice chat (WebRTC)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/ArmSal/3PRJ2.git
cd 3PRJ2

# Start all services
docker-compose up --build

# Access the application
open http://localhost
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Vue.js web interface |
| Backend API | http://localhost/api | Node.js REST API |
| MySQL | localhost:3306 | Database (root/password) |

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/register | Create new account | No |
| POST | /api/login | Authenticate user | No |
| GET | /api/guilds | List all guilds | Yes |
| POST | /api/guilds | Create new guild | Yes |
| GET | /api/channels/:id/messages | Get channel messages | Yes |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-channel` | Client → Server | Subscribe to a channel |
| `send-message` | Client → Server | Send chat message |
| `new-message` | Server → Client | Receive new message |
| `game-invite` | Client → Server | Invite player to game |
| `game-join` | Client → Server | Join game session |
| `game-state` | Both | Sync game data (ball, scores) |
| `game-move` | Client → Server | Player input (paddle) |

## Project Structure

```
3PRJ2/
├── .github/workflows/     # CI/CD pipelines
│   ├── deploy.yml         # SSH deployment
│   └── docker-push.yml    # Docker Hub push
├── backend/               # Node.js backend
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/              # Vue.js frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── main.js
│       ├── router.js
│       ├── App.vue
│       └── views/
│           ├── Login.vue
│           ├── Chat.vue
│           └── Pong.vue
├── docker-compose.yml     # Local development
├── init.sql              # Database schema
├── ARCHITECTURE.md       # Detailed architecture
├── TEAM.md              # Team assignments
└── README.md            # This file
```

## Database Schema

### Tables

**users**
- id, username, email, password_hash, avatar_url, created_at

**guilds**
- id, name, description, created_by, created_at

**guild_members**
- id, user_id, guild_id, role (admin/moderator/member), joined_at

**channels**
- id, guild_id, name, type (text/voice)

**messages**
- id, channel_id, user_id, content, created_at

**games**
- id, channel_id, game_type, status, player1_id, player2_id, winner_id, created_at

## Deployment

### GitHub Actions

The repository includes two workflows:

1. **deploy.yml** - Deploys to a VM via SSH (requires `VM_HOST`, `VM_USER`, `VM_SSH_KEY` secrets)
2. **docker-push.yml** - Pushes images to Docker Hub (requires `DOCKER_USERNAME`, `DOCKER_PASSWORD`)

### Required Secrets

Go to Settings → Secrets and variables → Actions in your GitHub repo:

| Secret | Value |
|--------|-------|
| `VM_HOST` | Your server IP/domain |
| `VM_USER` | SSH username |
| `VM_SSH_KEY` | Private SSH key |

## Evaluation Criteria

This project is part of the **3PRJ2 Hackathon** with the following requirements:

- **40%** Technical (Docker, code quality, CI/CD, functionality)
- **30%** Innovation & UX (features, interface, experience)
- **20%** Collaboration (teamwork, Git management)
- **10%** Presentation (demo, technical choices)

**Bonus:** +20% for Kubernetes deployment

## License

Academic project for École IT - Bachelor 3
