const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// ============ DATABASE ============
let pool;
let isPostgres = false;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  isPostgres = true;
} else {
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'gaming_platform',
    waitForConnections: true,
    connectionLimit: 10,
  });
}

const query = async (sql, params) => {
  if (isPostgres) {
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIndex}`);
      paramIndex++;
    }
    const result = await pool.query(pgSql, params);
    return [result.rows];
  } else {
    return await pool.execute(sql, params);
  }
}

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

// ============ PONG GAME ENGINE ============
class PongGame {
  constructor(gameId, player1, player2, io) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.io = io;
    this.spectators = new Set();
    this.canvasWidth = 800;
    this.canvasHeight = 400;
    this.paddleWidth = 15;
    this.paddleHeight = 80;
    this.ballRadius = 10;
    this.reset();
    this.interval = null;
  }

  reset() {
    this.score1 = 0;
    this.score2 = 0;
    this.paddle1Y = (this.canvasHeight - this.paddleHeight) / 2;
    this.paddle2Y = (this.canvasHeight - this.paddleHeight) / 2;
    this.resetBall();
    this.gameOver = false;
  }

  resetBall() {
    this.ballX = this.canvasWidth / 2;
    this.ballY = this.canvasHeight / 2;
    this.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    this.ballSpeedY = (Math.random() * 2 - 1) * 3;
  }

  start() {
    this.interval = setInterval(() => this.update(), 1000 / 60);
  }

  update() {
    if (this.gameOver) return;
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;
    if (this.ballY - this.ballRadius < 0 || this.ballY + this.ballRadius > this.canvasHeight) {
      this.ballSpeedY = -this.ballSpeedY;
    }
    if (this.ballX - this.ballRadius < this.paddleWidth &&
        this.ballY > this.paddle1Y && this.ballY < this.paddle1Y + this.paddleHeight) {
      this.ballSpeedX = Math.abs(this.ballSpeedX) * 1.05;
      this.ballSpeedY += (this.ballY - (this.paddle1Y + this.paddleHeight / 2)) * 0.1;
    }
    if (this.ballX + this.ballRadius > this.canvasWidth - this.paddleWidth &&
        this.ballY > this.paddle2Y && this.ballY < this.paddle2Y + this.paddleHeight) {
      this.ballSpeedX = -Math.abs(this.ballSpeedX) * 1.05;
      this.ballSpeedY += (this.ballY - (this.paddle2Y + this.paddleHeight / 2)) * 0.1;
    }
    if (this.ballX < 0) {
      this.score2++;
      this.checkWin();
      this.resetBall();
    } else if (this.ballX > this.canvasWidth) {
      this.score1++;
      this.checkWin();
      this.resetBall();
    }
    this.broadcastState();
  }

  checkWin() {
    if (this.score1 >= 10 || this.score2 >= 10) {
      this.gameOver = true;
      const winner = this.score1 >= 10 ? this.player1 : this.player2;
      this.endGame(winner);
    }
  }

  movePaddle(player, direction) {
    const speed = 15;
    if (player === this.player1) {
      this.paddle1Y = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.paddle1Y + direction * speed));
    } else if (player === this.player2) {
      this.paddle2Y = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.paddle2Y + direction * speed));
    }
  }

  broadcastState() {
    const state = {
      ballX: this.ballX, ballY: this.ballY,
      paddle1Y: this.paddle1Y, paddle2Y: this.paddle2Y,
      score1: this.score1, score2: this.score2, gameOver: this.gameOver
    };
    this.io.to(`game-${this.gameId}`).emit('pong-state', state);
  }

  async endGame(winnerId) {
    clearInterval(this.interval);
    await query('UPDATE games SET status = ?, winner_id = ?, score1 = ?, score2 = ?, ended_at = NOW() WHERE id = ?',
      ['finished', winnerId, this.score1, this.score2, this.gameId]);
    await this.updateStats(this.player1, this.score1 > this.score2);
    await this.updateStats(this.player2, this.score2 > this.score1);
    this.io.to(`game-${this.gameId}`).emit('game-ended', { winner: winnerId });
  }

  async updateStats(userId, won) {
    const [existing] = await query('SELECT * FROM game_scores WHERE user_id = ? AND game_type = ?', [userId, 'pong']);
    if (existing[0]) {
      await query('UPDATE game_scores SET score = score + ?, games_played = games_played + 1, games_won = games_won + ? WHERE user_id = ? AND game_type = ?',
        [won ? 10 : 0, won ? 1 : 0, userId, 'pong']);
    } else {
      await query('INSERT INTO game_scores (user_id, game_type, score, games_played, games_won) VALUES (?, ?, ?, 1, ?)',
        [userId, 'pong', won ? 10 : 0, won ? 1 : 0]);
    }
  }

  addSpectator(socketId) { this.spectators.add(socketId); }
  removeSpectator(socketId) { this.spectators.delete(socketId); }
}

// ============ SNAKE GAME ENGINE ============
class SnakeGame {
  constructor(gameId, player1, player2, io) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.io = io;
    this.spectators = new Set();
    this.gridSize = 20;
    this.tileCount = 20;
    this.reset();
    this.interval = null;
  }

  reset() {
    this.snake1 = [{ x: 5, y: 10 }];
    this.snake2 = [{ x: 15, y: 10 }];
    this.direction1 = { x: 1, y: 0 };
    this.direction2 = { x: -1, y: 0 };
    this.food = this.spawnFood();
    this.score1 = 0; this.score2 = 0;
    this.gameOver = false;
    this.winner = null;
  }

  spawnFood() {
    return { x: Math.floor(Math.random() * this.tileCount), y: Math.floor(Math.random() * this.tileCount) };
  }

  start() { this.interval = setInterval(() => this.update(), 100); }

  update() {
    if (this.gameOver) return;
    this.moveSnake(this.snake1, this.direction1, 1);
    this.moveSnake(this.snake2, this.direction2, 2);
    this.broadcastState();
  }

  moveSnake(snake, direction, playerNum) {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.endGame(playerNum === 1 ? this.player2 : this.player1);
      return;
    }
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame(playerNum === 1 ? this.player2 : this.player1);
      return;
    }
    const otherSnake = playerNum === 1 ? this.snake2 : this.snake1;
    if (otherSnake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame(playerNum === 1 ? this.player2 : this.player1);
      return;
    }
    snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      if (playerNum === 1) this.score1++; else this.score2++;
      this.food = this.spawnFood();
      if (this.score1 >= 15 || this.score2 >= 15) {
        this.endGame(this.score1 >= 15 ? this.player1 : this.player2);
      }
    } else {
      snake.pop();
    }
  }

  changeDirection(player, newDir) {
    if (player === this.player1) {
      if (this.direction1.x !== -newDir.x || this.direction1.y !== -newDir.y) this.direction1 = newDir;
    } else if (player === this.player2) {
      if (this.direction2.x !== -newDir.x || this.direction2.y !== -newDir.y) this.direction2 = newDir;
    }
  }

  broadcastState() {
    const state = {
      snake1: this.snake1, snake2: this.snake2, food: this.food,
      score1: this.score1, score2: this.score2, gameOver: this.gameOver
    };
    this.io.to(`game-${this.gameId}`).emit('snake-state', state);
  }

  async endGame(winnerId) {
    if (this.gameOver) return;
    this.gameOver = true;
    clearInterval(this.interval);
    await query('UPDATE games SET status = ?, winner_id = ?, score1 = ?, score2 = ?, ended_at = NOW() WHERE id = ?',
      ['finished', winnerId, this.score1, this.score2, this.gameId]);
    await this.updateStats(this.player1, this.score1 > this.score2);
    await this.updateStats(this.player2, this.score2 > this.score1);
    this.io.to(`game-${this.gameId}`).emit('game-ended', { winner: winnerId });
  }

  async updateStats(userId, won) {
    const [existing] = await query('SELECT * FROM game_scores WHERE user_id = ? AND game_type = ?', [userId, 'snake']);
    if (existing[0]) {
      await query('UPDATE game_scores SET score = score + ?, games_played = games_played + 1, games_won = games_won + ? WHERE user_id = ? AND game_type = ?',
        [won ? 10 : 0, won ? 1 : 0, userId, 'snake']);
    } else {
      await query('INSERT INTO game_scores (user_id, game_type, score, games_played, games_won) VALUES (?, ?, ?, 1, ?)',
        [userId, 'snake', won ? 10 : 0, won ? 1 : 0]);
    }
  }

  addSpectator(socketId) { this.spectators.add(socketId); }
  removeSpectator(socketId) { this.spectators.delete(socketId); }
}

// ============ ACTIVE GAMES MANAGER ============
const activeGames = new Map();

// ============ API ROUTES ============

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Gaming Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: ['/api/register', '/api/login'],
      user: ['/api/profile', '/api/users/:id/profile'],
      guilds: ['/api/guilds', '/api/guilds/:id'],
      games: ['/api/games', '/api/games/active', '/api/leaderboard/:gameType'],
      tournaments: ['/api/tournaments', '/api/tournaments/:id']
    },
    socketio: 'ws://localhost:3000'
  });
});
  app.post('/api/register', async (req, res) => {
  const { username, email, password, campus } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    const userId = isPostgres ? result[0]?.id : result.insertId;
    if (campus) {
      await query('INSERT INTO user_profiles (user_id, campus) VALUES (?, ?)', [userId, campus]);
    } else {
      await query('INSERT INTO user_profiles (user_id) VALUES (?)', [userId]);
    }
    res.json({ success: true, userId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await query('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows[0] || !await bcrypt.compare(password, rows[0].password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: rows[0].id, username }, process.env.JWT_SECRET || 'secret');
  res.json({ token, user: { id: rows[0].id, username, email: rows[0].email } });
});

app.get('/api/profile', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT u.*, p.campus, p.bio, p.level, p.xp
    FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?
  `, [req.user.id]);
  const [scores] = await query('SELECT * FROM game_scores WHERE user_id = ?', [req.user.id]);
  res.json({ ...rows[0], scores });
});

app.put('/api/profile', auth, async (req, res) => {
  const { campus, bio } = req.body;
  await query('UPDATE user_profiles SET campus = ?, bio = ? WHERE user_id = ?', [campus, bio, req.user.id]);
  res.json({ success: true });
});

app.get('/api/users/:id/profile', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT u.id, u.username, u.avatar_url, p.campus, p.bio, p.level, p.xp
    FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?
  `, [req.params.id]);
  const [scores] = await query('SELECT * FROM game_scores WHERE user_id = ?', [req.params.id]);
  res.json({ ...rows[0], scores });
});

app.get('/api/guilds', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT g.*, u.username as creator_name, COUNT(DISTINCT gm.user_id) as member_count
    FROM guilds g JOIN users u ON g.created_by = u.id
    LEFT JOIN guild_members gm ON g.id = gm.guild_id GROUP BY g.id
  `, []);
  res.json(rows);
});

app.post('/api/guilds', auth, async (req, res) => {
  const { name, description } = req.body;
  const [result] = await query('INSERT INTO guilds (name, description, created_by) VALUES (?, ?, ?)', [name, description, req.user.id]);
  const insertId = isPostgres ? result[0]?.id : result.insertId;
  await query('INSERT INTO guild_members (user_id, guild_id, role) VALUES (?, ?, ?)', [req.user.id, insertId, 'admin']);
  await query('INSERT INTO channels (guild_id, name, type) VALUES (?, ?, ?)', [insertId, 'general', 'text']);
  await query('INSERT INTO channels (guild_id, name, type) VALUES (?, ?, ?)', [insertId, 'gaming', 'text']);
  res.json({ id: insertId });
});

app.get('/api/guilds/:id', auth, async (req, res) => {
  const [guild] = await query(`
    SELECT g.*, u.username as creator_name, COUNT(DISTINCT gm.user_id) as member_count
    FROM guilds g JOIN users u ON g.created_by = u.id
    LEFT JOIN guild_members gm ON g.id = gm.guild_id WHERE g.id = ? GROUP BY g.id
  `, [req.params.id]);
  const [channels] = await query('SELECT * FROM channels WHERE guild_id = ?', [req.params.id]);
  const [members] = await query(`
    SELECT gm.*, u.username, u.avatar_url FROM guild_members gm
    JOIN users u ON gm.user_id = u.id WHERE gm.guild_id = ?
  `, [req.params.id]);
  res.json({ ...guild[0], channels, members });
});

app.post('/api/guilds/:id/join', auth, async (req, res) => {
  try {
    await query('INSERT INTO guild_members (user_id, guild_id, role) VALUES (?, ?, ?)', [req.user.id, req.params.id, 'member']);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guilds/:id/leave', auth, async (req, res) => {
  await query('DELETE FROM guild_members WHERE user_id = ? AND guild_id = ?', [req.user.id, req.params.id]);
  res.json({ success: true });
});

app.get('/api/channels/:id/messages', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT m.*, u.username, u.avatar_url FROM messages m
    JOIN users u ON m.user_id = u.id WHERE m.channel_id = ?
    ORDER BY m.created_at DESC LIMIT 50
  `, [req.params.id]);
  res.json(rows.reverse());
});

app.post('/api/games', auth, async (req, res) => {
  const { channelId, gameType } = req.body;
  const [result] = await query('INSERT INTO games (channel_id, game_type, player1_id, status) VALUES (?, ?, ?, ?)',
    [channelId, gameType, req.user.id, 'waiting']);
  const gameId = isPostgres ? result[0]?.id : result.insertId;
  res.json({ id: gameId });
});

app.get('/api/games/active', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT g.*, u1.username as player1_name, u2.username as player2_name,
           c.guild_id, ch.name as channel_name
    FROM games g JOIN users u1 ON g.player1_id = u1.id
    LEFT JOIN users u2 ON g.player2_id = u2.id
    JOIN channels c ON g.channel_id = c.id
    JOIN channels ch ON g.channel_id = ch.id
    WHERE g.status IN ('waiting', 'playing') ORDER BY g.created_at DESC
  `, []);
  res.json(rows);
});

app.get('/api/games/:id', auth, async (req, res) => {
  const [rows] = await query(`
    SELECT g.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
    FROM games g JOIN users u1 ON g.player1_id = u1.id
    LEFT JOIN users u2 ON g.player2_id = u2.id
    LEFT JOIN users w ON g.winner_id = w.id WHERE g.id = ?
  `, [req.params.id]);
  res.json(rows[0]);
});

app.get('/api/leaderboard/:gameType', async (req, res) => {
  const [rows] = await query(`
    SELECT gs.*, u.username, u.avatar_url, p.campus FROM game_scores gs
    JOIN users u ON gs.user_id = u.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE gs.game_type = ? ORDER BY gs.score DESC LIMIT 100
  `, [req.params.gameType]);
  res.json(rows);
});

app.post('/api/tournaments', auth, async (req, res) => {
  const { name, description, gameType, campus1, campus2, maxParticipants, startsAt } = req.body;
  const [result] = await query(
    'INSERT INTO tournaments (name, description, game_type, campus1, campus2, max_participants, created_by, starts_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, gameType, campus1, campus2, maxParticipants || 16, req.user.id, new Date(startsAt)]
  );
  const tournamentId = isPostgres ? result[0]?.id : result.insertId;
  res.json({ id: tournamentId });
});

app.get('/api/tournaments', async (req, res) => {
  const [rows] = await query(`
    SELECT t.*, u.username as creator_name, COUNT(tp.id) as participant_count
    FROM tournaments t JOIN users u ON t.created_by = u.id
    LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
    GROUP BY t.id ORDER BY t.created_at DESC
  `, []);
  res.json(rows);
});

app.get('/api/tournaments/:id', auth, async (req, res) => {
  const [tournament] = await query(`
    SELECT t.*, u.username as creator_name FROM tournaments t
    JOIN users u ON t.created_by = u.id WHERE t.id = ?
  `, [req.params.id]);
  const [participants] = await query(`
    SELECT tp.*, u.username, u.avatar_url FROM tournament_participants tp
    JOIN users u ON tp.user_id = u.id WHERE tp.tournament_id = ? ORDER BY tp.registered_at
  `, [req.params.id]);
  const [matches] = await query(`
    SELECT tm.*, u1.username as player1_name, u2.username as player2_name, w.username as winner_name
    FROM tournament_matches tm
    LEFT JOIN users u1 ON tm.player1_id = u1.id
    LEFT JOIN users u2 ON tm.player2_id = u2.id
    LEFT JOIN users w ON tm.winner_id = w.id
    WHERE tm.tournament_id = ? ORDER BY tm.round, tm.match_number
  `, [req.params.id]);
  res.json({ ...tournament[0], participants, matches });
});

app.post('/api/tournaments/:id/join', auth, async (req, res) => {
  const { campus } = req.body;
  try {
    await query('INSERT INTO tournament_participants (tournament_id, user_id, campus) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, campus]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/start', auth, async (req, res) => {
  const [tournament] = await query('SELECT * FROM tournaments WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
  if (!tournament[0]) return res.status(403).json({ error: 'Only creator can start tournament' });
  const [participants] = await query('SELECT * FROM tournament_participants WHERE tournament_id = ?', [req.params.id]);
  const shuffled = participants.sort(() => Math.random() - 0.5);
  const rounds = Math.ceil(Math.log2(shuffled.length));
  for (let round = 1; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      let player1 = null, player2 = null;
      if (round === 1) {
        player1 = shuffled[i * 2]?.user_id || null;
        player2 = shuffled[i * 2 + 1]?.user_id || null;
      }
      await query('INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, round, i + 1, player1, player2]);
    }
  }
  await query('UPDATE tournaments SET status = ? WHERE id = ?', ['ongoing', req.params.id]);
  res.json({ message: 'Tournament started' });
});

// ============ SOCKET.IO ============
const onlineUsers = new Map();

const triviaQuestions = [
  { question: "Quelle est la capitale de la France?", options: ["Londres", "Berlin", "Paris", "Madrid"], answer: 2 },
  { question: "En quelle annee a ete cree le Web?", options: ["1989", "1995", "2000", "1985"], answer: 0 },
  { question: "Quel langage est utilise pour styliser les pages web?", options: ["JavaScript", "Python", "HTML", "CSS"], answer: 3 },
  { question: "Quelle est la planete la plus proche du Soleil?", options: ["Venus", "Mars", "Mercure", "Terre"], answer: 2 },
  { question: "Combien de bits dans un octet?", options: ["4", "8", "16", "32"], answer: 1 },
  { question: "Quel est le plus grand ocean?", options: ["Atlantique", "Indien", "Arctique", "Pacifique"], answer: 3 },
  { question: "Quelle est la racine carree de 144?", options: ["10", "11", "12", "13"], answer: 2 },
  { question: "Quel element a le symbole chimique 'O'?", options: ["Or", "Oxygene", "Osmium", "Ozone"], answer: 1 },
  { question: "Quelle est la monnaie du Japon?", options: ["Yuan", "Won", "Yen", "Dollar"], answer: 2 },
  { question: "Qui a peint la Joconde?", options: ["Van Gogh", "Picasso", "Michel-Ange", "Leonard de Vinci"], answer: 3 }
];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = user.id;
      socket.username = user.username;
      onlineUsers.set(user.id, { socketId: socket.id, username: user.username });
      socket.emit('authenticated', { success: true, userId: user.id });
      io.emit('user-online', { userId: user.id, username: user.username });
    } catch {
      socket.emit('authenticated', { success: false });
    }
  });

  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    socket.currentChannel = channelId;
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel-${channelId}`);
  });

  socket.on('send-message', async (data) => {
    const { channelId, content, userId } = data;
    try {
      await query('INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)', [channelId, userId, content]);
      io.to(`channel-${channelId}`).emit('new-message', { ...data, created_at: new Date(), username: socket.username });
    } catch (e) {
      console.error('Error saving message:', e);
    }
  });

  // WebRTC Voice
  socket.on('voice-join', (channelId) => {
    socket.join(`voice-${channelId}`);
    const room = io.sockets.adapter.rooms.get(`voice-${channelId}`);
    const users = [];
    if (room) {
      for (const clientId of room) {
        if (clientId !== socket.id) users.push(clientId);
      }
    }
    socket.emit('voice-users', users);
    socket.to(`voice-${channelId}`).emit('user-joined-voice', socket.id);
  });

  socket.on('voice-offer', (data) => {
    io.to(data.target).emit('voice-offer', { sender: socket.id, offer: data.offer });
  });

  socket.on('voice-answer', (data) => {
    io.to(data.target).emit('voice-answer', { sender: socket.id, answer: data.answer });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', { sender: socket.id, candidate: data.candidate });
  });

  socket.on('voice-leave', (channelId) => {
    socket.leave(`voice-${channelId}`);
    socket.to(`voice-${channelId}`).emit('user-left-voice', socket.id);
  });

  // Game management
  socket.on('create-game', async (data) => {
    const { channelId, gameType } = data;
    const [result] = await query('INSERT INTO games (channel_id, game_type, player1_id, status) VALUES (?, ?, ?, ?)',
      [channelId, gameType, socket.userId, 'waiting']);
    const gameId = isPostgres ? result[0]?.id : result.insertId;
    socket.join(`game-${gameId}`);
    socket.emit('game-created', { gameId, gameType });
    io.to(`channel-${channelId}`).emit('game-available', { gameId, gameType, player1: socket.username, player1Id: socket.userId });
  });

  socket.on('join-game', async (data) => {
    const { gameId } = data;
    const [games] = await query('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!games[0]) return socket.emit('error', { message: 'Game not found' });
    const game = games[0];
    if (game.player1_id === socket.userId) return socket.emit('error', { message: 'Cannot join your own game' });
    if (game.player2_id) return socket.emit('error', { message: 'Game is full' });
    await query('UPDATE games SET player2_id = ?, status = ? WHERE id = ?', [socket.userId, 'playing', gameId]);
    socket.join(`game-${gameId}`);
    if (game.game_type === 'pong') {
      const pongGame = new PongGame(gameId, game.player1_id, socket.userId, io);
      activeGames.set(gameId, pongGame);
      pongGame.start();
    } else if (game.game_type === 'snake') {
      const snakeGame = new SnakeGame(gameId, game.player1_id, socket.userId, io);
      activeGames.set(gameId, snakeGame);
      snakeGame.start();
    }
    io.to(`game-${gameId}`).emit('game-started', { gameId, gameType: game.game_type, player1: game.player1_id, player2: socket.userId });
  });

  // Spectator mode
  socket.on('spectate-game', async (data) => {
    const { gameId } = data;
    const game = activeGames.get(parseInt(gameId));
    if (game) {
      socket.join(`game-${gameId}`);
      game.addSpectator(socket.id);
      socket.emit('spectating-joined', { gameId });
      if (game.broadcastState) game.broadcastState();
    } else {
      socket.emit('error', { message: 'Game not available for spectating' });
    }
  });

  socket.on('stop-spectating', (data) => {
    const { gameId } = data;
    const game = activeGames.get(parseInt(gameId));
    if (game) game.removeSpectator(socket.id);
    socket.leave(`game-${gameId}`);
  });

  // Game controls
  socket.on('pong-move', (data) => {
    const { gameId, direction } = data;
    const game = activeGames.get(parseInt(gameId));
    if (game && game instanceof PongGame) game.movePaddle(socket.userId, direction);
  });

  socket.on('snake-move', (data) => {
    const { gameId, direction } = data;
    const game = activeGames.get(parseInt(gameId));
    if (game && game instanceof SnakeGame) {
      const dirMap = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      game.changeDirection(socket.userId, dirMap[direction]);
    }
  });

  // Trivia
  let triviaSessions = new Map();
  socket.on('start-trivia', async (data) => {
    const { gameId } = data;
    const shuffled = triviaQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
    triviaSessions.set(gameId, { questions: shuffled, scores: {} });
    io.to(`game-${gameId}`).emit('trivia-start', { questions: shuffled });
  });

  socket.on('trivia-answer', (data) => {
    const { gameId, questionIndex, answer, userId } = data;
    const session = triviaSessions.get(gameId);
    if (!session) return;
    const correct = session.questions[questionIndex].answer === answer;
    if (!session.scores[userId]) session.scores[userId] = 0;
    if (correct) session.scores[userId] += 10;
    io.to(`game-${gameId}`).emit('trivia-result', { userId, questionIndex, correct, scores: session.scores });
  });

  socket.on('game-invite', (data) => {
    const { targetUserId, gameId, gameType } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    if (targetSocket) {
      io.to(targetSocket.socketId).emit('game-invite', { from: socket.userId, fromUsername: socket.username, gameId, gameType });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user-offline', { userId: socket.userId });
    }
    for (const [gameId, game] of activeGames) {
      game.removeSpectator(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
