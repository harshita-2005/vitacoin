const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getTokenFromCookieHeader } = require('../utils/authCookie');

function extractToken(req) {
  const fromCookie = getTokenFromCookieHeader(req.headers.cookie);
  const auth = req.headers.authorization;
  const fromBearer =
    auth && auth.startsWith('Bearer') ? auth.split(' ')[1] : null;
  // Prefer cookie when present so a stale Bearer in localStorage cannot override a valid session cookie
  return fromCookie || fromBearer;
}

function jwtErrorResponse(res, error) {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Not authorized, token expired' });
  }
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
  return res.status(401).json({ error: 'Not authorized, token verification failed' });
}

// Middleware to protect routes
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return jwtErrorResponse(res, error);
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Not authorized as admin' });
  }
};

// Middleware to check if user is admin or moderator
const adminOrModerator = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
    next();
  } else {
    return res.status(403).json({ error: 'Not authorized as admin or moderator' });
  }
};

function extractSocketToken(socket) {
  const fromCookie = getTokenFromCookieHeader(socket.handshake.headers?.cookie);
  if (fromCookie) return fromCookie;
  const fromAuth = socket.handshake.auth?.token;
  if (fromAuth) return fromAuth;
  const header = socket.handshake.headers?.authorization;
  if (header && header.startsWith('Bearer')) {
    return header.split(' ')[1];
  }
  return null;
}

// Socket.IO authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = extractSocketToken(socket);

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.isActive) {
      return next(new Error('Authentication error: User account is deactivated'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = {
  protect,
  admin,
  adminOrModerator,
  authenticateSocket,
  generateToken,
  extractToken
};
