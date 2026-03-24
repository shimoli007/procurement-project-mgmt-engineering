const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unread_only === 'true') {
      sql += ' AND is_read = 0';
    }

    sql += ' ORDER BY created_at DESC';

    const notifications = queryAll(sql, params);
    const unreadCount = queryOne(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ notifications, unread_count: unreadCount ? unreadCount.count : 0 });
  } catch (err) {
    next(err);
  }
}

function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = queryOne(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [Number(id), req.user.id]
    );
    if (!notification) throw new AppError('Notification not found', 404);

    runAndSave('UPDATE notifications SET is_read = 1 WHERE id = ?', [Number(id)]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

function markAllAsRead(req, res, next) {
  try {
    runAndSave('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
