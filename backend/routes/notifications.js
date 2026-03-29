const express = require('express');
const { protect } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ notifications: [], unreadCount: 0 });
    }
    await notificationService.ensureDailyChallengeReminder(req.user._id);
    const data = await notificationService.listForUser(req.user._id);
    res.json(data);
  } catch (error) {
    console.error('Notifications list error:', error);
    res.status(500).json({ error: 'Could not load notifications' });
  }
});

router.post('/read-all', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.json({ success: true, unreadCount: 0 });
    }
    await notificationService.markAllRead(req.user._id);
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Could not mark all as read' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Notifications are not available for admin accounts' });
    }
    const n = await notificationService.markRead(req.user._id, req.params.id);
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    const unreadCount = await notificationService.unreadCount(req.user._id);
    res.json({ success: true, notification: n, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Could not update notification' });
  }
});

module.exports = router;
