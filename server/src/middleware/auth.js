const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

module.exports = { authenticate };
