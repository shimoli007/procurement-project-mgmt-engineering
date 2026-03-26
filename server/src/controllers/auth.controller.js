const bcrypt = require('bcryptjs');
const { queryOne } = require('../db/connection');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.role === 'Deactivated') {
      throw new AppError('This account has been deactivated', 403);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res, next) {
  try {
    const user = queryOne('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe };
