const path = require('path');
const fs = require('fs');
const { getDb, queryAll, runAndSave, save } = require('../db/connection');
const { AppError } = require('../utils/errors');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'procurement.db');

const TABLE_ORDER = [
  'users',
  'suppliers',
  'items',
  'item_suppliers',
  'projects',
  'bom_lines',
  'orders',
  'order_timeline',
  'notifications',
  'audit_log',
  'settings',
];

function exportDatabase(req, res, next) {
  try {
    const data = {};
    for (const table of TABLE_ORDER) {
      data[table] = queryAll(`SELECT * FROM ${table}`);
    }

    const exportPayload = {
      version: 1,
      exported_at: new Date().toISOString(),
      tables: data,
    };

    res.setHeader('Content-Disposition', 'attachment; filename=procurement-backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportPayload);
  } catch (err) {
    next(err);
  }
}

function restoreDatabase(req, res, next) {
  try {
    const payload = req.body;

    // Validate structure
    if (!payload || !payload.tables || typeof payload.tables !== 'object') {
      throw new AppError('Invalid backup format: missing tables object', 400);
    }

    // Validate that expected tables exist
    for (const table of TABLE_ORDER) {
      if (!Array.isArray(payload.tables[table])) {
        throw new AppError(`Invalid backup format: missing or invalid table "${table}"`, 400);
      }
    }

    const db = getDb();

    // Disable foreign keys during restore
    db.run('PRAGMA foreign_keys = OFF;');

    try {
      // Clear tables in reverse order to respect FK constraints
      for (const table of [...TABLE_ORDER].reverse()) {
        db.run(`DELETE FROM ${table}`);
      }

      // Re-import data in forward order
      for (const table of TABLE_ORDER) {
        const rows = payload.tables[table];
        if (rows.length === 0) continue;

        for (const row of rows) {
          const columns = Object.keys(row);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map((col) => row[col]);
          db.run(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
      }

      // Re-enable foreign keys
      db.run('PRAGMA foreign_keys = ON;');
      save();

      res.json({
        message: 'Database restored successfully',
        restored_at: new Date().toISOString(),
        tables: TABLE_ORDER.reduce((acc, t) => {
          acc[t] = payload.tables[t].length;
          return acc;
        }, {}),
      });
    } catch (innerErr) {
      // Re-enable foreign keys even on failure
      db.run('PRAGMA foreign_keys = ON;');
      throw innerErr;
    }
  } catch (err) {
    next(err);
  }
}

function downloadDb(req, res, next) {
  try {
    // Make sure we have latest saved version
    save();

    if (!fs.existsSync(DB_PATH)) {
      throw new AppError('Database file not found', 404);
    }

    res.setHeader('Content-Disposition', 'attachment; filename=procurement.db');
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(DB_PATH);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { exportDatabase, restoreDatabase, downloadDb };
