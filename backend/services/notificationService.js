const Notification = require('../models/Notification');
const User = require('../models/User');

const MAX_PER_USER = 100;

let socketIo = null;

function setSocketIo(io) {
  socketIo = io;
}

function emitRefresh(userId) {
  if (!socketIo) return;
  const uid = userId.toString();
  socketIo.to(`user_${uid}`).emit('notifications_refresh', { userId: uid });
}

async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, read: false });
}

async function trimOld(userId) {
  const count = await Notification.countDocuments({ user: userId });
  if (count <= MAX_PER_USER) return;
  const excess = count - MAX_PER_USER;
  const oldest = await Notification.find({ user: userId })
    .sort({ createdAt: 1 })
    .limit(excess)
    .select('_id');
  const ids = oldest.map((d) => d._id);
  if (ids.length) await Notification.deleteMany({ _id: { $in: ids } });
}

/**
 * Persist an in-app notification and nudge connected clients to refresh the bell.
 */
async function createInAppNotification(userId, { title, message, type = 'info', category = 'system' }) {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      category,
      read: false
    });
    await trimOld(userId);
    emitRefresh(userId);
  } catch (e) {
    console.error('createInAppNotification:', e.message);
  }
}

async function listForUser(userId, limit = 40) {
  const items = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const unread = await unreadCount(userId);
  return { notifications: items, unreadCount: unread };
}

async function markRead(userId, notificationId) {
  const n = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
  if (n) emitRefresh(userId);
  return n;
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  emitRefresh(userId);
}

/**
 * One reminder per local calendar day if daily challenge not completed.
 */
async function ensureDailyChallengeReminder(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role === 'admin') return;

    const today = new Date().toDateString();
    const challengeKey = `daily_${today}`;
    const raw = user.dailyChallengeCompleted;
    let completed = false;
    if (raw && typeof raw.get === 'function') {
      const data = raw.get(challengeKey);
      completed = !!(data && data.completed);
    }

    if (completed) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const exists = await Notification.findOne({
      user: userId,
      category: 'daily_challenge',
      createdAt: { $gte: start }
    });
    if (exists) return;

    await createInAppNotification(userId, {
      title: 'Daily challenge is ready',
      message: 'Play today’s daily challenge to earn Vitacoins and XP.',
      type: 'info',
      category: 'daily_challenge'
    });
  } catch (e) {
    console.warn('ensureDailyChallengeReminder:', e.message);
  }
}

/**
 * Admin-only: create the same in-app notification for many users (role `user` only unless userIds set).
 */
async function broadcastToUsers({ title, message, type = 'info', userIds = null }) {
  const filter = { isActive: true, role: 'user' };
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    filter._id = { $in: userIds };
  }
  const users = await User.find(filter).select('_id').lean();
  let sent = 0;
  for (const u of users) {
    await createInAppNotification(u._id, {
      title,
      message,
      type,
      category: 'announcement'
    });
    sent += 1;
  }
  return { sent };
}

module.exports = {
  setSocketIo,
  createInAppNotification,
  listForUser,
  markRead,
  markAllRead,
  unreadCount,
  ensureDailyChallengeReminder,
  broadcastToUsers
};
