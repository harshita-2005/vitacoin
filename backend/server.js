// Load environment variables FIRST (before anything else)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

const { getCorsOptions, getSocketIoCorsConfig } = require('./config/cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const badgeRoutes = require('./routes/badges');
const leaderboardRoutes = require('./routes/leaderboard');
const gameRoutes = require('./routes/games');
const challengeRoutes = require('./routes/challenges');
const adminRoutes = require('./routes/admin');
const adminTaskRoutes = require('./routes/adminTasks');
const walletRoutes = require('./routes/wallet');
const gamePlayRoutes = require('./routes/gamePlay');
const dailyChallengeRoutes = require('./routes/dailyChallenge');
const datasetRoutes = require('./routes/dataset');
const puzzleRoutes = require('./routes/puzzles');
const mcqRoutes = require('./routes/mcqs');
const notificationRoutes = require('./routes/notifications');
const notificationService = require('./services/notificationService');

const { authenticateSocket } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/socketHandlers');

const app = express();
const server = http.createServer(app);

// Render / reverse proxy: trust X-Forwarded-* for rate limiting and secure cookies
app.set('trust proxy', 1);

const io = socketIo(server, {
  cors: getSocketIoCorsConfig()
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin';

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
  console.warn('Warning: MONGODB_URI not found in .env file');
  console.warn('Make sure .env file exists in backend/ folder');
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('Error: JWT_SECRET must be set in production');
}

async function connectDbAndBootstrap() {
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    const { ensureDefaultGamesIfEmpty } = require('./services/gameBootstrap');
    await ensureDefaultGamesIfEmpty();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Connection string:', mongoUri.substring(0, 30) + '...');
      console.error('\nTroubleshooting:');
      console.error('1. Verify MONGODB_URI in .env file');
      console.error('2. Check MongoDB Atlas Network Access (should allow 0.0.0.0/0)');
      console.error('3. Verify database user has read/write permissions');
      console.error('4. Check if password has special characters (need URL encoding)');
    }
    throw err;
  }
}

// Security: allow cross-origin fetches to this API (frontend on Vercel)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors(getCorsOptions()));
app.options('*', cors(getCorsOptions()));

app.use(cookieParser());

// Rate limiting (skip health check for load balancers / Render)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: true }
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return limiter(req, res, next);
});

app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

io.use(authenticateSocket);
setupSocketHandlers(io);

app.set('io', io);
notificationService.setSocketIo(io);

app.get('/', (req, res) => {
  res.send('Vitacoin Backend is Live');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/game', gamePlayRoutes);
app.use('/api/daily-challenge', dailyChallengeRoutes);
app.use('/api/dataset', datasetRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'OK',
    db: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  if (err.message && String(err.message).includes('CORS')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Origin not allowed'
    });
  }
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDbAndBootstrap();
  } catch (e) {
    console.error('Database unavailable at startup — API may return errors until MongoDB is reachable.');
  }
  server.listen(PORT, () => {
    console.log(`Vitacoin server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
  });
}

startServer();

module.exports = { app, server, io };
