const { queryAll } = require('../db/connection');

function getAuditLog(req, res, next) {
  try {
    const { entity_type, entity_id, user_id, start_date, end_date } = req.query;

    let sql = `SELECT al.*, u.name as user_name
               FROM audit_log al
               LEFT JOIN users u ON u.id = al.user_id
               WHERE 1=1`;
    const params = [];

    if (entity_type) {
      sql += ' AND al.entity_type = ?';
      params.push(entity_type);
    }
    if (entity_id) {
      sql += ' AND al.entity_id = ?';
      params.push(Number(entity_id));
    }
    if (user_id) {
      sql += ' AND al.user_id = ?';
      params.push(Number(user_id));
    }
    if (start_date) {
      sql += ' AND al.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND al.created_at <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY al.created_at DESC LIMIT 500';

    const entries = queryAll(sql, params);
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuditLog };
