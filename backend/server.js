const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'gaming_platform',
  waitForConnections: true,
  connectionLimit: 10,
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows[0] || !await bcrypt.compare(password, rows[0].password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: rows[0].id, username }, process.env.JWT_SECRET || 'secret');
  res.json({ token, user: { id: rows[0].id, username, email: rows[0].email } });
});

app.get('/api/guilds', auth, async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT g.*, u.username as creator_name 
    FROM guilds g 
    JOIN users u ON g.created_by = u.id
  `);
  res.json(rows);
});

app.post('/api/guilds', auth, async (req, res) => {
  const { name, description } = req.body;
  const [result] = await pool.execute('INSERT INTO guilds (name, description, created_by) VALUES (?, ?, ?)', 
    [name, description, req.user.id]);
  await pool.execute('INSERT INTO channels (guild_id, name, type) VALUES (?, ?, ?)', 
    [result.insertId, 'general', 'text']);
  res.json({ id: result.insertId });
});

app.get('/api/channels/:guildId/messages', auth, async (req, res) => {
  const [rows] = await pool.execute(`
    SELECT m.*, u.username 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.channel_id = ? 
    ORDER BY m.created_at DESC 
    LIMIT 50
  `, [req.params.guildId]);
  res.json(rows.reverse());
});

// Socket.IO
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
  });
  
  socket.on('send-message', async (data) => {
    const { channelId, content, userId } = data;
    await pool.execute('INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)', 
      [channelId, userId, content]);
    io.to(`channel-${channelId}`).emit('new-message', { ...data, created_at: new Date() });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
