// Load environment variables FIRST (before anything else)
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

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

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitacoin';

// Only show debug in development if connection fails
if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  MONGODB_URI not found in .env file');
  console.warn('💡 Make sure .env file exists in backend/ folder');
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // Timeout for Atlas connection
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('✅ Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('💡 Connection string:', mongoUri.substring(0, 30) + '...');
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify MONGODB_URI in .env file');
    console.error('2. Check MongoDB Atlas Network Access (should allow 0.0.0.0/0)');
    console.error('3. Verify database user has read/write permissions');
    console.error('4. Check if password has special characters (need URL encoding)');
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Setup Socket.IO handlers
setupSocketHandlers(io);

app.set('io', io);
notificationService.setSocketIo(io);

// API Routes
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Vitacoin server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

module.exports = { app, server, io };
