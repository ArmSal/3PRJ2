# API Documentation - Gaming Platform Backend

## Base URL
- Local: `http://localhost:3000`
- Production: Depending on deployment

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## REST API Endpoints

### Authentication

#### POST /api/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "campus": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "userId": 1
}
```

#### POST /api/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

### User Profile

#### GET /api/profile
Get current user profile with stats.

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "campus": "string",
  "bio": "string",
  "level": 1,
  "xp": 0,
  "scores": [
    {
      "game_type": "pong",
      "score": 100,
      "games_played": 10,
      "games_won": 5
    }
  ]
}
```

#### PUT /api/profile
Update user profile.

**Request Body:**
```json
{
  "campus": "string",
  "bio": "string"
}
```

#### GET /api/users/:id/profile
Get public profile of any user.

### Guilds (Communities)

#### GET /api/guilds
List all guilds with member count.

#### GET /api/guilds/:id
Get detailed guild info with channels and members.

#### POST /api/guilds
Create a new guild.

**Request Body:**
```json
{
  "name": "string",
  "description": "string"
}
```

#### POST /api/guilds/:id/join
Join a guild.

#### POST /api/guilds/:id/leave
Leave a guild.

### Messages

#### GET /api/channels/:id/messages
Get messages for a channel (last 50, reversed chronological).

### Games

#### POST /api/games
Create a new game session.

**Request Body:**
```json
{
  "channelId": 1,
  "gameType": "pong|snake|trivia"
}
```

#### GET /api/games/active
List all active games.

#### GET /api/games/:id
Get game details.

### Leaderboard

#### GET /api/leaderboard/:gameType
Get leaderboard for a game type (pong, snake, trivia).

**Response:**
```json
[
  {
    "user_id": 1,
    "username": "string",
    "campus": "string",
    "score": 100,
    "games_played": 10,
    "games_won": 5
  }
]
```

### Tournaments

#### GET /api/tournaments
List all tournaments.

#### GET /api/tournaments/:id
Get tournament details with participants and matches.

#### POST /api/tournaments
Create a new inter-campus tournament.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "gameType": "pong|snake|trivia",
  "campus1": "string",
  "campus2": "string",
  "maxParticipants": 16,
  "startsAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/tournaments/:id/join
Join a tournament.

**Request Body:**
```json
{
  "campus": "string"
}
```

#### POST /api/tournaments/:id/start
Start the tournament (creator only).

## Socket.IO Events

### Connection
Connect to Socket.IO server and authenticate:

```javascript
const socket = io('http://localhost:3000');
socket.emit('authenticate', token);
```

### Authentication Events

#### authenticate
Send JWT token to authenticate socket connection.

**Payload:** `token string`

#### authenticated
Received after successful authentication.

**Payload:**
```json
{
  "success": true,
  "userId": 1
}
```

### Chat Events

#### join-channel
Subscribe to a channel for messages.

**Payload:** `channelId`

#### leave-channel
Unsubscribe from a channel.

**Payload:** `channelId`

#### send-message
Send a message to a channel.

**Payload:**
```json
{
  "channelId": 1,
  "content": "string",
  "userId": 1
}
```

#### new-message
Received when a new message arrives.

**Payload:**
```json
{
  "channelId": 1,
  "content": "string",
  "userId": 1,
  "username": "string",
  "created_at": "timestamp"
}
```

### Voice Chat Events (WebRTC)

#### voice-join
Join voice channel.

**Payload:** `channelId`

#### voice-users
Received list of users in voice channel.

**Payload:** `[socketId1, socketId2, ...]`

#### user-joined-voice
Received when someone joins voice.

**Payload:** `socketId`

#### voice-offer
Send WebRTC offer.

**Payload:**
```json
{
  "target": "socketId",
  "offer": "RTCSessionDescription"
}
```

#### voice-answer
Send WebRTC answer.

**Payload:**
```json
{
  "target": "socketId",
  "answer": "RTCSessionDescription"
}
```

#### ice-candidate
Send ICE candidate.

**Payload:**
```json
{
  "target": "socketId",
  "candidate": "RTCIceCandidate"
}
```

#### voice-leave
Leave voice channel.

**Payload:** `channelId`

### Game Events

#### create-game
Create a new game.

**Payload:**
```json
{
  "channelId": 1,
  "gameType": "pong|snake|trivia"
}
```

#### game-created
Received when game is created.

**Payload:**
```json
{
  "gameId": 1,
  "gameType": "string"
}
```

#### join-game
Join an existing game.

**Payload:**
```json
{
  "gameId": 1
}
```

#### game-started
Received when game starts.

**Payload:**
```json
{
  "gameId": 1,
  "gameType": "string",
  "player1": 1,
  "player2": 2
}
```

#### game-available
Received when a game is created in your channel.

**Payload:**
```json
{
  "gameId": 1,
  "gameType": "string",
  "player1": "string",
  "player1Id": 1
}
```

### Spectator Mode

#### spectate-game
Join as spectator.

**Payload:**
```json
{
  "gameId": 1
}
```

#### spectating-joined
Received when successfully joined as spectator.

**Payload:**
```json
{
  "gameId": 1
}
```

#### stop-spectating
Leave spectator mode.

**Payload:**
```json
{
  "gameId": 1
}
```

### Pong Game Events

#### pong-move
Move paddle.

**Payload:**
```json
{
  "gameId": 1,
  "direction": -1 | 1
}
```

#### pong-state
Received game state update (60fps).

**Payload:**
```json
{
  "ballX": 400,
  "ballY": 200,
  "paddle1Y": 150,
  "paddle2Y": 150,
  "score1": 0,
  "score2": 0,
  "gameOver": false
}
```

### Snake Game Events

#### snake-move
Change direction.

**Payload:**
```json
{
  "gameId": 1,
  "direction": "up|down|left|right"
}
```

#### snake-state
Received game state update.

**Payload:**
```json
{
  "snake1": [{"x": 5, "y": 10}],
  "snake2": [{"x": 15, "y": 10}],
  "food": {"x": 10, "y": 10},
  "score1": 0,
  "score2": 0,
  "gameOver": false
}
```

### Trivia Game Events

#### start-trivia
Start trivia game.

**Payload:**
```json
{
  "gameId": 1
}
```

#### trivia-start
Received when trivia starts.

**Payload:**
```json
{
  "questions": [
    {
      "question": "string",
      "options": ["a", "b", "c", "d"],
      "answer": 0
    }
  ]
}
```

#### trivia-answer
Submit answer.

**Payload:**
```json
{
  "gameId": 1,
  "questionIndex": 0,
  "answer": 0,
  "userId": 1
}
```

#### trivia-result
Received after answer.

**Payload:**
```json
{
  "userId": 1,
  "questionIndex": 0,
  "correct": true,
  "scores": {
    "1": 10,
    "2": 0
  }
}
```

### General Game Events

#### game-ended
Received when game ends.

**Payload:**
```json
{
  "winner": 1
}
```

#### game-invite
Invite a user to play.

**Payload:**
```json
{
  "targetUserId": 2,
  "gameId": 1,
  "gameType": "string"
}
```

Received when invited:
```json
{
  "from": 1,
  "fromUsername": "string",
  "gameId": 1,
  "gameType": "string"
}
```

### User Presence Events

#### user-online
Received when a user comes online.

**Payload:**
```json
{
  "userId": 1,
  "username": "string"
}
```

#### user-offline
Received when a user goes offline.

**Payload:**
```json
{
  "userId": 1
}
```

## Error Handling

### REST Errors
```json
{
  "error": "Error message"
}
```

### Socket Errors
```json
{
  "message": "Error message"
}
```

## Game Mechanics

### Pong
- 2 players
- First to 10 points wins
- Paddle control: direction -1 (up) or 1 (down)
- Ball speeds up on paddle hit
- State broadcast at 60fps

### Snake
- 2 players
- Grid-based (20x20)
- Eat food to grow and score
- First to 15 points wins
- Collision with wall, self, or other snake = loss

### Trivia
- Multiple players
- 5 random questions per game
- 10 points per correct answer
- No time limit

## Tournament System

Tournaments are inter-campus competitions with bracket elimination:

1. Create tournament with campus1 vs campus2
2. Users join with their campus affiliation
3. Creator starts tournament to generate bracket
4. Matches are created automatically
5. Players play their assigned matches
6. Winners advance to next round

### Tournament Bracket Generation
- Single elimination
- Seeded randomly
- Bye given if odd number of participants
- Matches tracked in tournament_matches table
