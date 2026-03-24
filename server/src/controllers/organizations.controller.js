const crypto = require('crypto');
const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function getOrganization(req, res, next) {
  try {
    // Get or create default organization
    let org = queryOne('SELECT * FROM organizations LIMIT 1');
    if (!org) {
      runAndSave(
        `INSERT INTO organizations (name, slug, plan) VALUES (?, ?, ?)`,
        ['My Organization', 'my-org', 'free']
      );
      org = queryOne('SELECT * FROM organizations LIMIT 1');
    }
    res.json(org);
  } catch (err) {
    next(err);
  }
}

function updateOrganization(req, res, next) {
  try {
    const { name, slug, logo_url, primary_color } = req.body;
    let org = queryOne('SELECT * FROM organizations LIMIT 1');
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (slug !== undefined) { updates.push('slug = ?'); params.push(slug); }
    if (logo_url !== undefined) { updates.push('logo_url = ?'); params.push(logo_url); }
    if (primary_color !== undefined) { updates.push('primary_color = ?'); params.push(primary_color); }

    if (updates.length > 0) {
      params.push(org.id);
      runAndSave(`UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    org = queryOne('SELECT * FROM organizations WHERE id = ?', [org.id]);
    res.json(org);
  } catch (err) {
    next(err);
  }
}

function getSubscription(req, res, next) {
  try {
    const org = queryOne('SELECT * FROM organizations LIMIT 1');
    const plan = org?.plan || 'free';

    const plans = {
      free: {
        name: 'Free',
        price: 0,
        features: ['Up to 100 items', 'Up to 50 orders/month', 'Basic reports', '1 API key'],
        limits: { items: 100, orders_per_month: 50, api_keys: 1, users: 5 },
      },
      pro: {
        name: 'Pro',
        price: 49,
        features: ['Unlimited items', 'Unlimited orders', 'Advanced reports', '10 API keys', 'Webhooks', 'Priority support'],
        limits: { items: -1, orders_per_month: -1, api_keys: 10, users: 25 },
      },
      enterprise: {
        name: 'Enterprise',
        price: 199,
        features: ['Everything in Pro', 'Custom integrations', 'SSO', 'Unlimited API keys', 'Dedicated support', 'SLA guarantee'],
        limits: { items: -1, orders_per_month: -1, api_keys: -1, users: -1 },
      },
    };

    res.json({
      current_plan: plan,
      plan_details: plans[plan] || plans.free,
      all_plans: plans,
    });
  } catch (err) {
    next(err);
  }
}

function generateApiKey(req, res, next) {
  try {
    const { name, permissions } = req.body;
    if (!name) {
      throw new AppError('API key name is required', 400);
    }

    const org = queryOne('SELECT * FROM organizations LIMIT 1');
    if (!org) {
      throw new AppError('Organization not found', 404);
    }

    // Generate a random API key
    const rawKey = 'pk_' + crypto.randomBytes(24).toString('hex');
    const keyPrefix = rawKey.slice(0, 10) + '...';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const id = runAndSave(
      `INSERT INTO api_keys (organization_id, name, key_hash, key_prefix, permissions) VALUES (?, ?, ?, ?, ?)`,
      [org.id, name, keyHash, keyPrefix, permissions || 'read']
    );

    res.status(201).json({
      id,
      name,
      key: rawKey, // Only shown once!
      key_prefix: keyPrefix,
      permissions: permissions || 'read',
      message: 'Save this key now. It will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
}

function listApiKeys(req, res, next) {
  try {
    const keys = queryAll(`
      SELECT id, name, key_prefix, permissions, last_used_at, created_at
      FROM api_keys
      ORDER BY created_at DESC
    `);
    res.json(keys);
  } catch (err) {
    next(err);
  }
}

function revokeApiKey(req, res, next) {
  try {
    const { id } = req.params;
    const key = queryOne('SELECT * FROM api_keys WHERE id = ?', [Number(id)]);
    if (!key) {
      throw new AppError('API key not found', 404);
    }
    runAndSave('DELETE FROM api_keys WHERE id = ?', [Number(id)]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Webhook management
function listWebhooks(req, res, next) {
  try {
    const webhooks = queryAll('SELECT * FROM webhooks ORDER BY created_at DESC');
    res.json(webhooks);
  } catch (err) {
    next(err);
  }
}

function createWebhook(req, res, next) {
  try {
    const { url, events } = req.body;
    if (!url || !events) {
      throw new AppError('URL and events are required', 400);
    }

    const org = queryOne('SELECT * FROM organizations LIMIT 1');
    const secret = crypto.randomBytes(16).toString('hex');
    const eventsStr = Array.isArray(events) ? events.join(',') : events;

    const id = runAndSave(
      `INSERT INTO webhooks (organization_id, url, events, secret) VALUES (?, ?, ?, ?)`,
      [org?.id || 1, url, eventsStr, secret]
    );

    res.status(201).json({
      id,
      url,
      events: eventsStr,
      secret,
      is_active: 1,
    });
  } catch (err) {
    next(err);
  }
}

function deleteWebhook(req, res, next) {
  try {
    const { id } = req.params;
    runAndSave('DELETE FROM webhooks WHERE id = ?', [Number(id)]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrganization,
  updateOrganization,
  getSubscription,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  listWebhooks,
  createWebhook,
  deleteWebhook,
};
