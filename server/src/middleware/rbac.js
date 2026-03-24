const { AppError } = require('../utils/errors');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role(s): ${roles.join(', ')}`, 403));
    }
    next();
  };
}

module.exports = { requireRole };
