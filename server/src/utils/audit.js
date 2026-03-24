const { runAndSave } = require('../db/connection');

/**
 * Log an audit entry.
 * @param {number|null} userId - The user performing the action
 * @param {string} action - e.g. 'create', 'update', 'delete'
 * @param {string} entityType - e.g. 'item', 'order', 'project', 'supplier'
 * @param {number|null} entityId - The ID of the affected entity
 * @param {object|null} oldValues - Previous values (for updates/deletes)
 * @param {object|null} newValues - New values (for creates/updates)
 */
function logAudit(userId, action, entityType, entityId, oldValues, newValues) {
  try {
    runAndSave(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entityType,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
      ]
    );
  } catch (err) {
    // Audit logging should not break the main operation
    console.error('Failed to log audit entry:', err.message);
  }
}

module.exports = { logAudit };
