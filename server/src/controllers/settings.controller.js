const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

const DEFAULT_SETTINGS = [
  { key: 'company_name', value: 'My Company' },
  { key: 'currency', value: 'USD' },
  { key: 'date_format', value: 'YYYY-MM-DD' },
  { key: 'low_stock_threshold', value: '10' },
  { key: 'auto_approve_orders', value: 'false' },
  { key: 'notification_email_enabled', value: 'true' },
  { key: 'default_lead_time_days', value: '14' },
  { key: 'tax_rate', value: '0' },
];

function initializeDefaults() {
  for (const { key, value } of DEFAULT_SETTINGS) {
    const existing = queryOne('SELECT key FROM settings WHERE key = ?', [key]);
    if (!existing) {
      runAndSave(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        [key, value]
      );
    }
  }
}

function getAllSettings(req, res, next) {
  try {
    initializeDefaults();
    const settings = queryAll('SELECT key, value, updated_at FROM settings ORDER BY key');
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

function getSetting(req, res, next) {
  try {
    const { key } = req.params;
    const setting = queryOne('SELECT key, value, updated_at FROM settings WHERE key = ?', [key]);
    if (!setting) throw new AppError('Setting not found', 404);
    res.json(setting);
  } catch (err) {
    next(err);
  }
}

function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined || value === null) {
      throw new AppError('value is required', 400);
    }

    const existing = queryOne('SELECT key FROM settings WHERE key = ?', [key]);
    if (existing) {
      runAndSave(
        "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?",
        [String(value), key]
      );
    } else {
      runAndSave(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
        [key, String(value)]
      );
    }

    const setting = queryOne('SELECT key, value, updated_at FROM settings WHERE key = ?', [key]);
    res.json(setting);
  } catch (err) {
    next(err);
  }
}

function bulkUpdateSettings(req, res, next) {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      throw new AppError('settings must be an array', 400);
    }

    for (const { key, value } of settings) {
      if (!key || value === undefined || value === null) {
        throw new AppError('Each setting must have a key and value', 400);
      }

      const existing = queryOne('SELECT key FROM settings WHERE key = ?', [key]);
      if (existing) {
        runAndSave(
          "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?",
          [String(value), key]
        );
      } else {
        runAndSave(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
          [key, String(value)]
        );
      }
    }

    const allSettings = queryAll('SELECT key, value, updated_at FROM settings ORDER BY key');
    res.json(allSettings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllSettings, getSetting, updateSetting, bulkUpdateSettings, initializeDefaults };
