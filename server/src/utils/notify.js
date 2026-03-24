const { runAndSave } = require('../db/connection');

/**
 * Create a notification for a user.
 * @param {number} userId - The recipient user ID
 * @param {string} type - Notification type e.g. 'order_status', 'order_assigned', 'project_created'
 * @param {string} title - Short title
 * @param {string|null} message - Detailed message
 * @param {string|null} entityType - Related entity type e.g. 'order', 'project'
 * @param {number|null} entityId - Related entity ID
 */
function createNotification(userId, type, title, message, entityType, entityId) {
  try {
    runAndSave(
      `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        title,
        message || null,
        entityType || null,
        entityId || null,
      ]
    );
  } catch (err) {
    // Notification creation should not break the main operation
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { createNotification };
