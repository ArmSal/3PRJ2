import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import initSocketHandler from './sockets/socketHandler';
import initDb from './config/initDb';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io with professional CORS configuration
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with specific origins
    methods: ['GET', 'POST']
  }
});

// Neural Socket Link Initialization
initSocketHandler(io);

// Main Operational Loop
const startServer = async () => {
  try {
    // Synchronize Database Schema
    await initDb();
    
    server.listen(PORT, () => {
      console.log(`
      🚀 NEURAL NETWORK ONLINE
      ====================================
      URL: http://localhost:${PORT}
      MODE: ${process.env.NODE_ENV || 'development'}
      PROTOCOLS: HTTP, WebSockets, WebRTC
      ====================================
      `);
    });
  } catch (err) {
    console.error('❌ CRITICAL SYSTEM FAILURE: Could not start neural network.', err);
    process.exit(1);
  }
};

startServer();
