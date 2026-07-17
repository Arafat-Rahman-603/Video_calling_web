import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { connectDB, closeDB } from './config-db';
import authRoutes from './routes-auth';
import usersRoutes from './routes-users';
import callsRoutes from './routes-calls';
import messagesRoutes from './routes-messages';
import { setupSignalingHandlers } from './sockets-signaling';
import { setupChatHandlers } from './sockets-chat';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

// CORS configuration for Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;

  console.log(`[Socket.io] New connection: ${socket.id} (userId: ${userId})`);

  // Setup event handlers
  setupSignalingHandlers(io, socket);
  setupChatHandlers(io, socket);

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Socket.io] Socket error for ${userId}:`, error);
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error('[Express] Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
});

// Start the application
startServer();

export { app, io };
