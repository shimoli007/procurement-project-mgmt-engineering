const bcrypt = require('bcryptjs');
const { queryAll, queryOne, runAndSave } = require('../db/connection');
const { AppError } = require('../utils/errors');

function listUsers(req, res, next) {
  try {
    const users = queryAll('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name');
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      throw new AppError('name, email, password, and role are required', 400);
    }

    const validRoles = ['Sales', 'Engineer', 'Procurement'];
    if (!validRoles.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) throw new AppError('Email already exists', 409);

    const password_hash = await bcrypt.hash(password, 10);
    const id = runAndSave(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    const user = queryOne('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM users WHERE id = ?', [Number(id)]);
    if (!existing) throw new AppError('User not found', 404);

    const { name, email, password, role } = req.body;

    if (role) {
      const validRoles = ['Sales', 'Engineer', 'Procurement'];
      if (!validRoles.includes(role)) {
        throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
      }
    }

    if (email && email !== existing.email) {
      const emailTaken = queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, Number(id)]);
      if (emailTaken) throw new AppError('Email already exists', 409);
    }

    let password_hash = existing.password_hash;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    runAndSave(
      `UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, updated_at = datetime('now') WHERE id = ?`,
      [
        name ?? existing.name,
        email ?? existing.email,
        password_hash,
        role ?? existing.role,
        Number(id),
      ]
    );

    const user = queryOne('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', [Number(id)]);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser };
