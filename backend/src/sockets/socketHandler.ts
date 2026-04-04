import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import snakeService from '../services/SnakeService';
import pongService from '../services/PongService';
import triviaService from '../services/TriviaService';
import chessService from '../services/ChessService';

interface CustomSocket extends Socket {
  data: {
    userId?: number;
    username?: string;
  };
}

const onlineUsers = new Map<number, { id: number, socketId: string, username: string }>();

export default (io: Server) => {
  io.on('connection', (socket: CustomSocket) => {
    console.log('⚡ NEURAL LINK ESTABLISHED:', socket.id);

    socket.on('authenticate', (token: string) => {
      try {
        const secret = process.env.JWT_SECRET || 'hackathon-jury-key-2024';
        const decoded = jwt.verify(token, secret) as { id: number, username: string };
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
        
        onlineUsers.set(decoded.id, { id: decoded.id, socketId: socket.id, username: decoded.username });
        
        console.log(`📡 NEURAL LINK AUTHENTICATED: [${decoded.id}] ${decoded.username}`);
        socket.emit('authenticated', { success: true, userId: decoded.id });
        io.emit('user-online', { id: decoded.id, username: decoded.username });
        
        // Broadcast online users to the newly connected client
        const users = Array.from(onlineUsers.values()).map(u => ({ id: u.id, username: u.username }));
        socket.emit('users:online', users);
      } catch (err) {
        console.warn('⚠️ NEURAL LINK REJECTED: Authentication failed', err);
        socket.emit('authenticated', { success: false });
      }
    });

    socket.on('get-online-users', () => {
      const users = Array.from(onlineUsers.values()).map(u => ({ id: u.id, username: u.username }));
      socket.emit('users:online', users);
    });

    // --- CHAT & CHANNELS ---
    socket.on('join-channel', (channelId: number) => {
      socket.join(`channel-${channelId}`);
      console.log(`📡 NEURAL LINK: Socket [${socket.id}] joined tactical room [channel-${channelId}]`);
    });

    socket.on('send-message', async (data: { channelId: number, content: string, token?: string }) => {
      // Emergency Identity Check: If state is lost, attempt to recover from token
      let userId = socket.data.userId;
      let username = socket.data.username;

      if (!userId && data.token) {
        try {
          const secret = process.env.JWT_SECRET || 'hackathon-jury-key-2024';
          const decoded = jwt.verify(data.token, secret) as { id: number, username: string };
          userId = decoded.id;
          username = decoded.username;
        } catch (e) {}
      }

      if (!userId) {
        console.warn(`🛑 TRANSMISSION REJECTED: Identity could not be verified for socket [${socket.id}].`);
        socket.emit('error', { message: 'NEURAL_LINK_INVALID: Please re-login.' });
        return;
      }
      
      // Verify user exists in database before attempting to insert message
      try {
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
          console.warn(`🛑 TRANSMISSION REJECTED: User [${userId}] does not exist in database.`);
          socket.emit('error', { 
            message: 'NEXUS_IDENTITY_INVALID: User not found. Please re-register or login.' 
          });
          return;
        }
      } catch (err) {
        console.error('❌ USER_VERIFICATION_FAILURE:', err);
        socket.emit('error', { message: 'NEXUS_CORE_FAILURE: Database verification failed.' });
        return;
      }
      
      console.log(`📩 INCOMING TRANSMISSION from [${username}] in channel [${data.channelId}]: ${data.content}`);
      
      try {
        await query('INSERT INTO messages (channel_id, user_id, content) VALUES ($1, $2, $3)', 
          [data.channelId, userId, data.content]);
        
        const roomName = `channel-${data.channelId}`;
        const messagePayload = {
          channelId: data.channelId,
          content: data.content,
          userId: userId,
          username: username,
          created_at: new Date().toISOString()
        };

        // Broadcast to tactical room (includes sender)
        io.to(roomName).emit('new-message', messagePayload);
        
        console.log(`✅ TRANSMISSION BROADCASTED to room [${roomName}]`);
      } catch (err: any) {
        console.error('❌ MSG_FAILURE:', err);
        socket.emit('error', { 
          message: 'NEXUS_CORE_FAILURE: Transmission failed to persist.',
          technical: err.message,
          detail: err.detail,
          hint: err.hint,
          code: err.code
        });
      }
    });

    // --- WebRTC VOICE SIGNALING ---
    socket.on('voice-join', (channelId: number) => {
      socket.join(`voice-${channelId}`);
      const room = io.sockets.adapter.rooms.get(`voice-${channelId}`);
      const users: string[] = [];
      if (room) {
        for (const clientId of room) {
          if (clientId !== socket.id) users.push(clientId);
        }
      }
      socket.emit('voice-users', users);
      socket.to(`voice-${channelId}`).emit('user-joined-voice', socket.id);
    });

    socket.on('voice-offer', (data: { target: string, offer: any }) => {
      io.to(data.target).emit('voice-offer', { sender: socket.id, offer: data.offer });
    });

    socket.on('voice-answer', (data: { target: string, answer: any }) => {
      io.to(data.target).emit('voice-answer', { sender: socket.id, answer: data.answer });
    });

    socket.on('ice-candidate', (data: { target: string, candidate: any }) => {
      io.to(data.target).emit('ice-candidate', { sender: socket.id, candidate: data.candidate });
    });

    // --- GAME ENGINE INTEGRATION ---
    socket.on('create-game', async (data: { channelId: number, gameType: string }) => {
      if (!socket.data.userId) return;
      try {
        // Simplified game creation for hackathon MVP
        const gameId = `game-${Date.now()}`;
        socket.join(gameId);
        socket.emit('game-created', { gameId, gameType: data.gameType });
        
        // Broadcast to channel that a game is waiting
        io.to(`channel-${data.channelId}`).emit('game-available', {
          gameId,
          gameType: data.gameType,
          player1: socket.data.username,
          player1Id: socket.data.userId
        });
      } catch (err) {
        socket.emit('error', { message: 'GAME_INIT_FAILED' });
      }
    });

    socket.on('join-game', (data: { gameId: string, player1Id: number, player1: string, gameType: string }) => {
      if (!socket.data.userId || !socket.data.username) return;
      const { gameId, player1Id, player1, gameType } = data;
      
      socket.join(gameId);
      
      // Initialize the specific game service
      if (gameType === 'snake') {
        snakeService.createGame(gameId);
      } else if (gameType === 'pong') {
        // player1 is the username passed from the frontend for the host
        pongService.createGame(gameId, player1Id, player1, socket.data.userId, socket.data.username, io);
      } else if (gameType === 'trivia') {
        triviaService.createGame(gameId, player1Id, socket.data.userId, io);
      } else if (gameType === 'chess') {
        chessService.createGame(gameId, player1Id, socket.data.userId, io);
      }

      io.to(gameId).emit('game-started', { 
        gameId, 
        gameType, 
        player1: player1Id, 
        player1Name: player1,
        player2: socket.data.userId,
        player2Name: socket.data.username
      });
    });

    // --- GAME CONTROLS ---
    socket.on('snake-move', (data: { gameId: string, direction: string }) => {
      if (!socket.data.userId) return;
      const state = snakeService.moveSnake(data.gameId, 1, data.direction); // Simplified player logic
      if (state) io.to(data.gameId).emit('snake-state', state);
    });

    socket.on('pong-move', (data: { gameId: string, direction: 'up' | 'down' }) => {
      if (!socket.data.userId) return;
      const state = pongService.getGame(data.gameId);
      if (!state) return;
      const playerNum = socket.data.userId === state.player1 ? 1 : 2;
      pongService.movePaddle(data.gameId, playerNum, data.direction);
    });

    socket.on('trivia-answer', (data: { gameId: string, answerIndex: number }) => {
      if (!socket.data.userId) return;
      triviaService.submitAnswer(data.gameId, socket.data.userId, data.answerIndex, io);
    });

    socket.on('chess-move', (data: { gameId: string, from: any, to: any }) => {
      if (!socket.data.userId) return;
      chessService.move(data.gameId, socket.data.userId, data.from, data.to, io);
    });

    socket.on('disconnect', () => {
      if (socket.data.userId) {
        console.log('📡 LINK TERMINATED:', socket.data.username);
        onlineUsers.delete(socket.data.userId);
        io.emit('user-offline', { userId: socket.data.userId });
      }
    });
  });
};
