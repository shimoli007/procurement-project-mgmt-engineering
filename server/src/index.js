const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db/connection');
const { errorHandler } = require('./utils/errors');

const authRoutes = require('./routes/auth.routes');
const itemsRoutes = require('./routes/items.routes');
const suppliersRoutes = require('./routes/suppliers.routes');
const ordersRoutes = require('./routes/orders.routes');
const projectsRoutes = require('./routes/projects.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const usersRoutes = require('./routes/users.routes');
const importExportRoutes = require('./routes/import-export.routes');
const bulkRoutes = require('./routes/bulk.routes');
const reportRoutes = require('./routes/reports.routes');
const notificationRoutes = require('./routes/notifications.routes');
const auditRoutes = require('./routes/audit.routes');
const settingsRoutes = require('./routes/settings.routes');
const backupRoutes = require('./routes/backup.routes');
const searchRoutes = require('./routes/search.routes');
const aiRoutes = require('./routes/ai.routes');
const organizationRoutes = require('./routes/organizations.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '5mb' }));

// Health check (before auth routes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: 'Too many login attempts, please try again later' } });

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', importExportRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/organization', organizationRoutes);

// Serve React frontend in production
const path = require('path');
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next(new (require('./utils/errors').AppError)('Not found', 404));
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize database then start server
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
